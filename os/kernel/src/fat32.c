/*
 * AlphaOS - FAT32 Filesystem Implementation
 *
 * Read-only FAT32 driver.
 */

#include "fat32.h"
#include "string.h"
#include "heap.h"

/* Sector buffer */
static u8 sector_buf[512] __attribute__((aligned(64)));

/* Read FAT entry */
static u32 fat32_get_fat_entry(Fat32Context* ctx, u32 cluster) {
    u32 fat_offset = cluster * 4;
    u32 fat_sector = ctx->fat_start_sector + (fat_offset / ctx->bytes_per_sector);
    u32 entry_offset = fat_offset % ctx->bytes_per_sector;

    if (ctx->read_sector(ctx->disk_ctx, fat_sector, sector_buf) < 0) {
        return 0x0FFFFFFF;  /* End of chain on error */
    }

    u32 entry = *(u32*)(sector_buf + entry_offset);
    return entry & 0x0FFFFFFF;
}

/* Convert cluster to sector */
static u32 cluster_to_sector(Fat32Context* ctx, u32 cluster) {
    return ctx->data_start_sector + (cluster - 2) * ctx->sectors_per_cluster;
}

/* Initialize FAT32 context */
int fat32_init(Fat32Context* ctx,
               int (*read_sector)(void* disk_ctx, u32 sector, void* buffer),
               void* disk_ctx) {
    ctx->read_sector = read_sector;
    ctx->disk_ctx = disk_ctx;

    /* Read boot sector */
    if (read_sector(disk_ctx, 0, sector_buf) < 0) {
        return -1;
    }

    Fat32BootSector* bpb = (Fat32BootSector*)sector_buf;

    /* Validate */
    if (bpb->bytes_per_sector != 512) return -2;  /* Only support 512 byte sectors */
    if (bpb->num_fats == 0) return -3;

    /* Extract BPB info */
    ctx->bytes_per_sector = bpb->bytes_per_sector;
    ctx->sectors_per_cluster = bpb->sectors_per_cluster;
    ctx->reserved_sectors = bpb->reserved_sectors;
    ctx->fat_start_sector = bpb->reserved_sectors;
    ctx->fat_size = bpb->fat_size_32;
    ctx->root_cluster = bpb->root_cluster;

    /* Calculate data region start */
    ctx->data_start_sector = ctx->reserved_sectors +
                             (bpb->num_fats * ctx->fat_size);

    /* Calculate cluster size */
    ctx->cluster_size = ctx->bytes_per_sector * ctx->sectors_per_cluster;

    /* Calculate total clusters */
    u32 total_sectors = bpb->total_sectors_32;
    u32 data_sectors = total_sectors - ctx->data_start_sector;
    ctx->total_clusters = data_sectors / ctx->sectors_per_cluster;

    return 0;
}

/* Convert filename to 8.3 format */
static void name_to_83(const char* name, u8* name83) {
    memset(name83, ' ', 11);

    int i = 0;
    int j = 0;

    /* Copy name part (up to 8 chars) */
    while (name[i] && name[i] != '.' && j < 8) {
        char c = name[i++];
        if (c >= 'a' && c <= 'z') c -= 32;  /* Uppercase */
        name83[j++] = c;
    }

    /* Skip to extension */
    while (name[i] && name[i] != '.') i++;
    if (name[i] == '.') i++;

    /* Copy extension (up to 3 chars) */
    j = 8;
    while (name[i] && j < 11) {
        char c = name[i++];
        if (c >= 'a' && c <= 'z') c -= 32;
        name83[j++] = c;
    }
}

/* Find entry in directory cluster chain */
static int find_in_directory(Fat32Context* ctx, u32 dir_cluster,
                              const char* name, Fat32DirEntry* out_entry) {
    u8 name83[11];
    name_to_83(name, name83);

    u32 cluster = dir_cluster;

    while (cluster >= 2 && cluster < 0x0FFFFFF8) {
        u32 sector = cluster_to_sector(ctx, cluster);

        for (u32 s = 0; s < ctx->sectors_per_cluster; s++) {
            if (ctx->read_sector(ctx->disk_ctx, sector + s, sector_buf) < 0) {
                return -1;
            }

            Fat32DirEntry* entries = (Fat32DirEntry*)sector_buf;
            u32 entries_per_sector = ctx->bytes_per_sector / sizeof(Fat32DirEntry);

            for (u32 e = 0; e < entries_per_sector; e++) {
                Fat32DirEntry* entry = &entries[e];

                /* End of directory */
                if (entry->name[0] == 0x00) return -1;

                /* Deleted entry */
                if (entry->name[0] == 0xE5) continue;

                /* Skip long name entries */
                if ((entry->attr & FAT_ATTR_LONG_NAME) == FAT_ATTR_LONG_NAME) continue;

                /* Skip volume label */
                if (entry->attr & FAT_ATTR_VOLUME_ID) continue;

                /* Compare name */
                if (memcmp(entry->name, name83, 11) == 0) {
                    memcpy(out_entry, entry, sizeof(Fat32DirEntry));
                    return 0;
                }
            }
        }

        /* Next cluster in chain */
        cluster = fat32_get_fat_entry(ctx, cluster);
    }

    return -1;  /* Not found */
}

/* Open file by path */
int fat32_open(Fat32Context* ctx, const char* path, Fat32File* file) {
    /* Skip leading slash */
    if (*path == '/') path++;

    u32 current_cluster = ctx->root_cluster;
    Fat32DirEntry entry;

    while (*path) {
        /* Extract next path component */
        char component[256];
        int i = 0;
        while (*path && *path != '/' && i < 255) {
            component[i++] = *path++;
        }
        component[i] = '\0';

        if (*path == '/') path++;

        if (i == 0) continue;

        /* Find in current directory */
        if (find_in_directory(ctx, current_cluster, component, &entry) < 0) {
            return -1;  /* Not found */
        }

        u32 entry_cluster = ((u32)entry.first_cluster_hi << 16) | entry.first_cluster_lo;

        /* If more path components, this must be a directory */
        if (*path && !(entry.attr & FAT_ATTR_DIRECTORY)) {
            return -2;  /* Not a directory */
        }

        current_cluster = entry_cluster;
    }

    /* Fill file handle */
    file->fs = ctx;
    file->first_cluster = ((u32)entry.first_cluster_hi << 16) | entry.first_cluster_lo;
    file->current_cluster = file->first_cluster;
    file->cluster_offset = 0;
    file->file_size = entry.file_size;
    file->position = 0;

    return 0;
}

/* Read from file */
int fat32_read(Fat32File* file, void* buffer, u32 size) {
    if (!file || !file->fs) return -1;

    u8* dst = (u8*)buffer;
    u32 bytes_read = 0;

    while (size > 0 && file->position < file->file_size) {
        /* Check if we need to advance to next cluster */
        if (file->cluster_offset >= file->fs->cluster_size) {
            file->current_cluster = fat32_get_fat_entry(file->fs, file->current_cluster);
            if (file->current_cluster >= 0x0FFFFFF8) break;  /* End of chain */
            file->cluster_offset = 0;
        }

        /* Calculate sector within cluster */
        u32 sector_in_cluster = file->cluster_offset / file->fs->bytes_per_sector;
        u32 offset_in_sector = file->cluster_offset % file->fs->bytes_per_sector;

        u32 sector = cluster_to_sector(file->fs, file->current_cluster) + sector_in_cluster;

        /* Read sector */
        if (file->fs->read_sector(file->fs->disk_ctx, sector, sector_buf) < 0) {
            return bytes_read > 0 ? bytes_read : -2;
        }

        /* Copy data */
        u32 available_in_sector = file->fs->bytes_per_sector - offset_in_sector;
        u32 remaining_in_file = file->file_size - file->position;
        u32 to_copy = size;
        if (to_copy > available_in_sector) to_copy = available_in_sector;
        if (to_copy > remaining_in_file) to_copy = remaining_in_file;

        memcpy(dst, sector_buf + offset_in_sector, to_copy);

        dst += to_copy;
        size -= to_copy;
        bytes_read += to_copy;
        file->position += to_copy;
        file->cluster_offset += to_copy;
    }

    return bytes_read;
}

/* Seek in file */
int fat32_seek(Fat32File* file, u32 position) {
    if (!file || !file->fs) return -1;
    if (position > file->file_size) position = file->file_size;

    /* If seeking backwards, start from beginning */
    if (position < file->position) {
        file->current_cluster = file->first_cluster;
        file->cluster_offset = 0;
        file->position = 0;
    }

    /* Advance through clusters */
    while (file->position < position) {
        u32 remaining_in_cluster = file->fs->cluster_size - file->cluster_offset;
        u32 to_advance = position - file->position;

        if (to_advance >= remaining_in_cluster) {
            /* Move to next cluster */
            file->current_cluster = fat32_get_fat_entry(file->fs, file->current_cluster);
            if (file->current_cluster >= 0x0FFFFFF8) break;
            file->position += remaining_in_cluster;
            file->cluster_offset = 0;
        } else {
            file->cluster_offset += to_advance;
            file->position += to_advance;
        }
    }

    return 0;
}

/* Close file */
void fat32_close(Fat32File* file) {
    if (file) {
        file->fs = NULL;
    }
}

/* Get file size */
u32 fat32_size(Fat32File* file) {
    return file ? file->file_size : 0;
}

/* List directory */
int fat32_list_dir(Fat32Context* ctx, const char* path,
                   void (*callback)(const char* name, u32 size, bool is_dir, void* ctx),
                   void* callback_ctx) {
    u32 dir_cluster;

    if (path == NULL || path[0] == '\0' || (path[0] == '/' && path[1] == '\0')) {
        dir_cluster = ctx->root_cluster;
    } else {
        /* Open directory to get its cluster */
        Fat32File dir_file;
        if (fat32_open(ctx, path, &dir_file) < 0) {
            return -1;
        }
        dir_cluster = dir_file.first_cluster;
    }

    u32 cluster = dir_cluster;

    while (cluster >= 2 && cluster < 0x0FFFFFF8) {
        u32 sector = cluster_to_sector(ctx, cluster);

        for (u32 s = 0; s < ctx->sectors_per_cluster; s++) {
            if (ctx->read_sector(ctx->disk_ctx, sector + s, sector_buf) < 0) {
                return -2;
            }

            Fat32DirEntry* entries = (Fat32DirEntry*)sector_buf;
            u32 entries_per_sector = ctx->bytes_per_sector / sizeof(Fat32DirEntry);

            for (u32 e = 0; e < entries_per_sector; e++) {
                Fat32DirEntry* entry = &entries[e];

                if (entry->name[0] == 0x00) return 0;  /* End */
                if (entry->name[0] == 0xE5) continue;  /* Deleted */
                if ((entry->attr & FAT_ATTR_LONG_NAME) == FAT_ATTR_LONG_NAME) continue;
                if (entry->attr & FAT_ATTR_VOLUME_ID) continue;

                /* Convert 8.3 name to readable string */
                char name[13];
                int j = 0;

                /* Copy name */
                for (int i = 0; i < 8 && entry->name[i] != ' '; i++) {
                    name[j++] = entry->name[i];
                }

                /* Add extension */
                if (entry->name[8] != ' ') {
                    name[j++] = '.';
                    for (int i = 8; i < 11 && entry->name[i] != ' '; i++) {
                        name[j++] = entry->name[i];
                    }
                }
                name[j] = '\0';

                bool is_dir = (entry->attr & FAT_ATTR_DIRECTORY) != 0;
                callback(name, entry->file_size, is_dir, callback_ctx);
            }
        }

        cluster = fat32_get_fat_entry(ctx, cluster);
    }

    return 0;
}
