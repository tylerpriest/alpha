# Storage Specification

> **Topic:** NVMe driver and filesystem for persistent storage

## Job To Be Done

Enable reading and writing files to the MacBook's internal NVMe SSD so AlphaOS can store source code, configuration, and enable self-bootstrapping.

## Requirements

### NVMe Driver
1. **PCIe device detection** (done via pci.c)
2. **NVMe controller initialization**
3. **Admin queue setup**
4. **I/O queue setup**
5. **Identify controller/namespace commands**
6. **Read/Write block commands**

### Partition Support
1. **GPT partition table parsing**
2. **Partition enumeration**
3. **Boot partition detection**

### Filesystem
1. **FAT32** (simpler, good for boot)
   - Or **ext4** (more Unix-like, harder)
2. **File operations:** open, read, write, close, seek
3. **Directory operations:** list, create, remove
4. **Path resolution**

## NVMe Architecture

```
┌─────────────────────────────────────────┐
│              Application                │
├─────────────────────────────────────────┤
│             VFS Layer                   │
│   open() read() write() close()         │
├─────────────────────────────────────────┤
│            Filesystem                   │
│         FAT32 or ext4                   │
├─────────────────────────────────────────┤
│          Block Device                   │
│      read_block() write_block()         │
├─────────────────────────────────────────┤
│           NVMe Driver                   │
│     Submission/Completion Queues        │
├─────────────────────────────────────────┤
│         PCIe MMIO Access                │
└─────────────────────────────────────────┘
```

## NVMe Controller Interface

### Controller Registers (MMIO)
```c
typedef struct {
    u64 cap;        // Controller Capabilities
    u32 vs;         // Version
    u32 intms;      // Interrupt Mask Set
    u32 intmc;      // Interrupt Mask Clear
    u32 cc;         // Controller Configuration
    u32 reserved;
    u32 csts;       // Controller Status
    u32 nssr;       // NVM Subsystem Reset
    u32 aqa;        // Admin Queue Attributes
    u64 asq;        // Admin Submission Queue Base
    u64 acq;        // Admin Completion Queue Base
} __attribute__((packed)) NvmeRegs;
```

### Submission Queue Entry (64 bytes)
```c
typedef struct {
    u8  opcode;
    u8  flags;
    u16 cid;        // Command ID
    u32 nsid;       // Namespace ID
    u64 reserved;
    u64 mptr;       // Metadata Pointer
    u64 prp1;       // Data Pointer 1
    u64 prp2;       // Data Pointer 2
    u32 cdw10;      // Command-specific
    u32 cdw11;
    u32 cdw12;
    u32 cdw13;
    u32 cdw14;
    u32 cdw15;
} __attribute__((packed)) NvmeSqe;
```

### Command Flow
1. Write command to Submission Queue
2. Ring doorbell (write to SQ Tail register)
3. Controller processes command
4. Controller writes to Completion Queue
5. Driver reads completion status
6. Ring CQ Head doorbell

## GPT Partition Table

### GPT Header
```c
typedef struct {
    u64 signature;      // "EFI PART"
    u32 revision;
    u32 header_size;
    u32 header_crc32;
    u32 reserved;
    u64 current_lba;
    u64 backup_lba;
    u64 first_usable;
    u64 last_usable;
    u8  disk_guid[16];
    u64 partition_lba;
    u32 num_partitions;
    u32 entry_size;
    u32 partitions_crc;
} __attribute__((packed)) GptHeader;
```

## FAT32 Filesystem

### Boot Sector Fields
```c
typedef struct {
    u8  jump[3];
    u8  oem_name[8];
    u16 bytes_per_sector;
    u8  sectors_per_cluster;
    u16 reserved_sectors;
    u8  num_fats;
    u16 root_entries;       // 0 for FAT32
    u16 total_sectors_16;   // 0 for FAT32
    u8  media_type;
    u16 fat_size_16;        // 0 for FAT32
    u16 sectors_per_track;
    u16 num_heads;
    u32 hidden_sectors;
    u32 total_sectors_32;
    u32 fat_size_32;
    // ... more fields
} __attribute__((packed)) Fat32Bpb;
```

### File Operations
```c
// VFS interface
typedef struct {
    char name[256];
    u32 size;
    u32 cluster;
    u32 position;
    bool is_directory;
} File;

File* fs_open(const char* path, const char* mode);
int fs_read(File* f, void* buf, usize size);
int fs_write(File* f, const void* buf, usize size);
int fs_close(File* f);
int fs_seek(File* f, i32 offset, int whence);

int fs_mkdir(const char* path);
int fs_rmdir(const char* path);
int fs_readdir(const char* path, char** entries, int max);
```

## Acceptance Criteria

- [ ] NVMe controller detected and initialized
- [ ] Can read raw blocks from SSD
- [ ] GPT partition table parsed
- [ ] FAT32 filesystem mounted
- [ ] Can read file contents
- [ ] Can write new files
- [ ] Can list directories
- [ ] Can create directories

## Dependencies

- PCI enumeration (done)
- Heap allocator (done)
- Interrupt handling (for completion)

## Files to Create

- `drivers/storage/nvme.c` - NVMe driver
- `drivers/storage/nvme.h` - NVMe structures
- `drivers/storage/gpt.c` - GPT parsing
- `drivers/storage/fat32.c` - FAT32 filesystem
- `kernel/src/vfs.c` - Virtual filesystem layer
- `kernel/include/vfs.h` - VFS interface
