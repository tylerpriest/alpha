/*
 * AlphaOS - FAT32 Filesystem
 *
 * Read-only FAT32 support for loading files from USB.
 */

#ifndef _FAT32_H
#define _FAT32_H

#include "types.h"

/* FAT32 Boot Sector (BPB) */
typedef struct {
    u8  jump[3];
    u8  oem_name[8];
    u16 bytes_per_sector;
    u8  sectors_per_cluster;
    u16 reserved_sectors;
    u8  num_fats;
    u16 root_entry_count;       /* 0 for FAT32 */
    u16 total_sectors_16;       /* 0 for FAT32 */
    u8  media_type;
    u16 fat_size_16;            /* 0 for FAT32 */
    u16 sectors_per_track;
    u16 num_heads;
    u32 hidden_sectors;
    u32 total_sectors_32;

    /* FAT32 specific */
    u32 fat_size_32;
    u16 ext_flags;
    u16 fs_version;
    u32 root_cluster;
    u16 fs_info;
    u16 backup_boot_sector;
    u8  reserved[12];
    u8  drive_number;
    u8  reserved1;
    u8  boot_signature;
    u32 volume_id;
    u8  volume_label[11];
    u8  fs_type[8];
} __attribute__((packed)) Fat32BootSector;

/* Directory entry (32 bytes) */
typedef struct {
    u8  name[11];               /* 8.3 filename */
    u8  attr;
    u8  nt_reserved;
    u8  create_time_tenth;
    u16 create_time;
    u16 create_date;
    u16 access_date;
    u16 first_cluster_hi;
    u16 modify_time;
    u16 modify_date;
    u16 first_cluster_lo;
    u32 file_size;
} __attribute__((packed)) Fat32DirEntry;

/* File attributes */
#define FAT_ATTR_READ_ONLY  0x01
#define FAT_ATTR_HIDDEN     0x02
#define FAT_ATTR_SYSTEM     0x04
#define FAT_ATTR_VOLUME_ID  0x08
#define FAT_ATTR_DIRECTORY  0x10
#define FAT_ATTR_ARCHIVE    0x20
#define FAT_ATTR_LONG_NAME  0x0F

/* FAT32 filesystem context */
typedef struct {
    /* Disk read function */
    int (*read_sector)(void* ctx, u32 sector, void* buffer);
    void* disk_ctx;

    /* BPB info */
    u32 bytes_per_sector;
    u32 sectors_per_cluster;
    u32 reserved_sectors;
    u32 fat_start_sector;
    u32 fat_size;
    u32 data_start_sector;
    u32 root_cluster;
    u32 total_clusters;

    /* Cluster size in bytes */
    u32 cluster_size;
} Fat32Context;

/* File handle */
typedef struct {
    Fat32Context* fs;
    u32 first_cluster;
    u32 current_cluster;
    u32 cluster_offset;
    u32 file_size;
    u32 position;
} Fat32File;

/* Initialize FAT32 context */
int fat32_init(Fat32Context* ctx,
               int (*read_sector)(void* ctx, u32 sector, void* buffer),
               void* disk_ctx);

/* Open file by path (e.g., "/BOOT/CONFIG.TXT") */
int fat32_open(Fat32Context* ctx, const char* path, Fat32File* file);

/* Read from file */
int fat32_read(Fat32File* file, void* buffer, u32 size);

/* Seek in file */
int fat32_seek(Fat32File* file, u32 position);

/* Close file */
void fat32_close(Fat32File* file);

/* Get file size */
u32 fat32_size(Fat32File* file);

/* List directory */
int fat32_list_dir(Fat32Context* ctx, const char* path,
                   void (*callback)(const char* name, u32 size, bool is_dir, void* ctx),
                   void* callback_ctx);

#endif /* _FAT32_H */
