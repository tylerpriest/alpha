# USB/SSD Boot Strategy for AlphaOS

## Overview

AlphaOS is designed to boot and run entirely from external media—USB flash drives or USB-C/Thunderbolt SSDs. This makes it a **portable, personal AI device** that you can plug into any compatible Mac.

---

## Why External Boot?

### Benefits

| Benefit | Description |
|---------|-------------|
| **Portability** | Carry your entire AI system in your pocket |
| **Non-destructive** | Never touches the Mac's internal storage |
| **Multi-machine** | Use on any compatible MacBook Pro |
| **Privacy** | Physically remove your data when done |
| **Testing** | Safe development without risking main OS |
| **Backup** | Clone the entire system easily |

### Use Cases

1. **Personal AI Assistant**: Plug in your AlphaOS drive, boot, interact with your AI, unplug and go
2. **Secure Workstation**: Air-gapped AI system that leaves no trace
3. **Development**: Test OS changes without touching internal drive
4. **Demo/Presentation**: Show AlphaOS on any compatible Mac

---

## Boot Media Options

### Option 1: USB Flash Drive

```
┌─────────────────────────────────────────────────────────────────┐
│                    USB FLASH DRIVE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Recommended: USB 3.0+ drive, 64GB minimum                      │
│                                                                 │
│  Pros:                                                          │
│  + Cheap ($10-30)                                               │
│  + Very portable (keychain size)                                │
│  + Widely available                                             │
│                                                                 │
│  Cons:                                                          │
│  - Slower (100-150 MB/s typical)                                │
│  - Limited write endurance                                      │
│  - Model loading takes longer                                   │
│                                                                 │
│  Best for: Testing, backup, emergency boot                      │
│                                                                 │
│  Recommended products:                                          │
│  - Samsung BAR Plus 128GB USB 3.1                               │
│  - SanDisk Extreme Pro USB 3.2                                  │
│  - Kingston DataTraveler Max                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Option 2: USB-C Portable SSD

```
┌─────────────────────────────────────────────────────────────────┐
│                    USB-C PORTABLE SSD                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Recommended: USB 3.1/3.2 SSD, 256GB minimum                   │
│                                                                 │
│  Pros:                                                          │
│  + Fast (400-1000 MB/s)                                         │
│  + Good endurance                                               │
│  + Direct USB-C connection to MacBook                           │
│  + Reasonable price ($40-100)                                   │
│                                                                 │
│  Cons:                                                          │
│  - Larger than flash drives                                     │
│  - Can get warm under load                                      │
│                                                                 │
│  Best for: Daily use, primary AlphaOS drive                    │
│                                                                 │
│  Recommended products:                                          │
│  - Samsung T7 500GB                                             │
│  - SanDisk Extreme Portable SSD                                 │
│  - Crucial X8 1TB                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Option 3: Thunderbolt 3 NVMe Enclosure

```
┌─────────────────────────────────────────────────────────────────┐
│                 THUNDERBOLT 3 NVMe SSD                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Recommended: TB3 enclosure + NVMe SSD, 500GB+                 │
│                                                                 │
│  Pros:                                                          │
│  + Extremely fast (2000+ MB/s)                                  │
│  + Near-internal SSD performance                                │
│  + Excellent for large models (7B+)                             │
│                                                                 │
│  Cons:                                                          │
│  - Expensive ($100-300)                                         │
│  - Larger form factor                                           │
│  - May need external power for some                             │
│                                                                 │
│  Best for: Power users, large knowledge bases                   │
│                                                                 │
│  Recommended products:                                          │
│  - OWC Envoy Pro FX                                             │
│  - Sabrent Rocket XTRM-Q                                        │
│  - CalDigit Tuff Nano Plus                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Partition Layout

### Recommended Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                    DISK LAYOUT                                  │
│                    (256 GB example)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ Partition 1: EFI System Partition (ESP)                   ││
│  │ Size: 512 MB                                               ││
│  │ Format: FAT32                                              ││
│  │ Flags: boot, esp                                           ││
│  │                                                            ││
│  │ Contents:                                                  ││
│  │ /EFI/BOOT/BOOTX64.EFI    - Limine bootloader              ││
│  │ /boot/limine.cfg          - Boot configuration            ││
│  │ /boot/kernel.elf          - AlphaOS kernel                ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ Partition 2: System                                        ││
│  │ Size: 8 GB                                                 ││
│  │ Format: FAT32 (for UEFI compatibility)                    ││
│  │                                                            ││
│  │ Contents:                                                  ││
│  │ /models/                                                   ││
│  │   ├── llama-3.2-3b-q4_k_m.gguf      (~2.0 GB)            ││
│  │   ├── llama-3.2-1b-q8.gguf          (~1.2 GB) [backup]   ││
│  │   └── minilm-l6-v2.gguf             (~50 MB)              ││
│  │ /tools/                              (~10 MB)              ││
│  │ /config/                             (~1 MB)               ││
│  │ /fonts/                              (~5 MB)               ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ Partition 3: Knowledge                                     ││
│  │ Size: Remaining (~247 GB)                                  ││
│  │ Format: ext4 (or FAT32 for simpler driver)                ││
│  │                                                            ││
│  │ Contents:                                                  ││
│  │ /knowledge.db             - SQLite + vectors               ││
│  │ /conversations/           - Chat history                   ││
│  │ /documents/               - User files                     ││
│  │ /cache/                   - Temporary data                 ││
│  │ /backup/                  - Auto-backups                   ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Minimal Layout (USB Flash Drive)

```
┌─────────────────────────────────────────────────────────────────┐
│                    MINIMAL LAYOUT                               │
│                    (32 GB USB drive)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ Single Partition: FAT32                                    ││
│  │ Size: ~32 GB                                               ││
│  │ Flags: boot, esp                                           ││
│  │                                                            ││
│  │ /EFI/BOOT/BOOTX64.EFI                                     ││
│  │ /boot/limine.cfg                                          ││
│  │ /boot/kernel.elf                                          ││
│  │ /models/llama-3.2-1b-q4.gguf         (~700 MB)           ││
│  │ /models/minilm.gguf                   (~50 MB)            ││
│  │ /data/knowledge.db                                        ││
│  │ /data/config.json                                         ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Note: Uses smaller 1B model for space constraints             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Creating the Boot Drive

### Prerequisites

```bash
# Linux tools
sudo apt install parted dosfstools mtools

# macOS tools
brew install mtools
# (parted not available, use diskutil)
```

### Method 1: Script-based (Linux)

```bash
#!/bin/bash
# create_alphaos_drive.sh

set -e

DEVICE=$1  # e.g., /dev/sdX
KERNEL_ELF="kernel.elf"
MODEL_FILE="llama-3.2-3b-q4_k_m.gguf"

if [ -z "$DEVICE" ]; then
    echo "Usage: $0 /dev/sdX"
    exit 1
fi

echo "WARNING: This will erase all data on $DEVICE"
read -p "Continue? [y/N] " confirm
if [ "$confirm" != "y" ]; then
    exit 1
fi

# Unmount any existing partitions
sudo umount ${DEVICE}* 2>/dev/null || true

# Create GPT partition table
sudo parted -s $DEVICE mklabel gpt

# Create ESP partition (512 MB)
sudo parted -s $DEVICE mkpart ESP fat32 1MiB 513MiB
sudo parted -s $DEVICE set 1 boot on
sudo parted -s $DEVICE set 1 esp on

# Create System partition (8 GB)
sudo parted -s $DEVICE mkpart System fat32 513MiB 8705MiB

# Create Knowledge partition (rest)
sudo parted -s $DEVICE mkpart Knowledge ext4 8705MiB 100%

# Format partitions
sudo mkfs.fat -F 32 -n ALPHAOS_ESP ${DEVICE}1
sudo mkfs.fat -F 32 -n ALPHAOS_SYS ${DEVICE}2
sudo mkfs.ext4 -L ALPHAOS_DATA ${DEVICE}3

# Mount and copy files
mkdir -p /tmp/alphaos_esp /tmp/alphaos_sys /tmp/alphaos_data

sudo mount ${DEVICE}1 /tmp/alphaos_esp
sudo mount ${DEVICE}2 /tmp/alphaos_sys
sudo mount ${DEVICE}3 /tmp/alphaos_data

# ESP contents
sudo mkdir -p /tmp/alphaos_esp/EFI/BOOT
sudo mkdir -p /tmp/alphaos_esp/boot
sudo cp limine/BOOTX64.EFI /tmp/alphaos_esp/EFI/BOOT/
sudo cp limine.cfg /tmp/alphaos_esp/boot/
sudo cp $KERNEL_ELF /tmp/alphaos_esp/boot/

# System contents
sudo mkdir -p /tmp/alphaos_sys/models
sudo mkdir -p /tmp/alphaos_sys/config
sudo mkdir -p /tmp/alphaos_sys/tools
sudo cp $MODEL_FILE /tmp/alphaos_sys/models/

# Knowledge contents
sudo mkdir -p /tmp/alphaos_data/conversations
sudo mkdir -p /tmp/alphaos_data/documents
sudo mkdir -p /tmp/alphaos_data/cache

# Initialize empty knowledge database
sqlite3 /tmp/alphaos_data/knowledge.db "CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);"
sudo mv /tmp/alphaos_data/knowledge.db /tmp/alphaos_data/ 2>/dev/null || true

# Unmount
sudo umount /tmp/alphaos_esp
sudo umount /tmp/alphaos_sys
sudo umount /tmp/alphaos_data

echo "AlphaOS drive created successfully on $DEVICE"
echo "You can now boot from this drive on a MacBook Pro"
```

### Method 2: Manual (macOS)

```bash
# Identify the disk (BE CAREFUL!)
diskutil list

# Assuming disk2 is your USB drive
DISK=disk2

# Erase and partition
diskutil eraseDisk GPT ALPHAOS /dev/$DISK

# Create partitions
diskutil addPartition $DISK APFS ALPHAOS_ESP 512M
diskutil addPartition $DISK MS-DOS ALPHAOS_SYS 8G
diskutil addPartition $DISK "Free Space" ALPHAOS_DATA R

# The ESP needs special handling on macOS
# Mount and copy files manually using Finder or cp
```

---

## Boot Process on MacBook Pro

### Step 1: Connect Drive

Plug the USB-C drive into any Thunderbolt 3 port on the MacBook Pro A1706.

### Step 2: Access Boot Menu

1. Shut down the MacBook completely
2. Press and hold the **Option (⌥)** key
3. Press the power button (keep holding Option)
4. Wait for the boot menu to appear

### Step 3: Select AlphaOS

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                    Select Boot Device                          │
│                                                                │
│     ┌─────────┐     ┌─────────┐     ┌─────────┐              │
│     │         │     │         │     │         │              │
│     │ Macintosh│     │   EFI   │     │ Recovery│              │
│     │   HD    │     │  Boot   │     │   HD    │              │
│     │         │     │         │     │         │              │
│     └─────────┘     └─────────┘     └─────────┘              │
│                           ▲                                    │
│                           │                                    │
│                     Select this                                │
│                     (AlphaOS)                                  │
│                                                                │
│     Use ← → to select, Enter to boot                          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Step 4: Boot Sequence

```
1. Limine bootloader loads
2. Shows boot menu (if configured)
3. Loads kernel.elf into memory
4. Transfers control to AlphaOS kernel
5. Kernel initializes hardware
6. Loads LLM from /models/
7. Presents AI interface
```

---

## Startup Manager (Future Feature)

Eventually, AlphaOS can include its own boot manager:

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                    ░█████╗░                                    │
│                    ██╔══██╗                                    │
│                    ███████║                                    │
│                    ██╔══██║                                    │
│                    ██║  ██║                                    │
│                    ╚═╝  ╚═╝                                    │
│                                                                │
│                   AlphaOS Startup                              │
│                                                                │
│   ──────────────────────────────────────────────────────────   │
│                                                                │
│   [1] Start AlphaOS (default in 5s)                           │
│   [2] Start AlphaOS (Safe Mode)                               │
│   [3] Start AlphaOS (Verbose)                                 │
│   [4] Boot to macOS                                            │
│   [5] Shutdown                                                 │
│                                                                │
│   Press 1-5 or wait for automatic boot...                     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Performance Considerations

### Model Loading Time

| Media Type | Speed | 2GB Model Load |
|------------|-------|----------------|
| USB 2.0 Flash | 30 MB/s | ~67 seconds |
| USB 3.0 Flash | 100 MB/s | ~20 seconds |
| USB 3.1 SSD | 500 MB/s | ~4 seconds |
| Thunderbolt 3 | 2000 MB/s | ~1 second |

**Recommendation**: Use USB 3.1+ SSD for acceptable boot times.

### Knowledge Base Performance

| Operation | USB Flash | USB SSD | TB3 NVMe |
|-----------|-----------|---------|----------|
| Vector search (1000 docs) | 500ms | 50ms | 10ms |
| Document indexing | Slow | Fast | Very fast |
| Conversation save | 100ms | 10ms | 2ms |

### Memory Mapping

For large models, we can use mmap() to load only needed portions:

```c
// Instead of loading entire model into RAM
void* model = mmap(NULL, model_size, PROT_READ, MAP_PRIVATE, fd, 0);

// Pages loaded on demand from SSD
// Slower initial inference, but lower RAM usage
```

---

## Persistence and State

### What's Saved

| Data | Location | Persistence |
|------|----------|-------------|
| Conversations | /conversations/ | Permanent |
| Knowledge | /knowledge.db | Permanent |
| Documents | /documents/ | Permanent |
| User settings | /config/ | Permanent |
| Cache | /cache/ | Cleared on boot |
| Session state | RAM | Lost on shutdown |

### Safe Shutdown

```
User: "Shut down"

AlphaOS:
1. Flush all pending writes
2. Sync knowledge database
3. Save current conversation
4. Write session metadata
5. Unmount partitions cleanly
6. Call ACPI shutdown

"All data saved. Goodbye."
[System powers off]
```

### Crash Recovery

```
On boot, check:
1. Was last shutdown clean? (flag file)
2. If not, run fsck on knowledge partition
3. Recover any journal entries
4. Report any data loss to user

"Note: Your last session ended unexpectedly.
 I've recovered your conversation up to [timestamp]."
```

---

## Security Considerations

### Physical Security

The USB drive contains:
- Your conversations (potentially sensitive)
- Your documents
- Your AI's learned preferences

**Recommendations**:
1. Enable encryption on knowledge partition (LUKS)
2. Require passphrase on boot
3. Keep physical possession of drive
4. Consider secure erase before disposal

### Encrypted Knowledge Partition

```bash
# Create encrypted partition
sudo cryptsetup luksFormat ${DEVICE}3
sudo cryptsetup open ${DEVICE}3 alphaos_data
sudo mkfs.ext4 /dev/mapper/alphaos_data

# On boot, kernel prompts for passphrase
# Decrypts partition before mounting
```

### Boot Integrity

Future enhancement: Secure Boot support

```
1. Sign kernel with your own key
2. Enroll key in Mac's firmware
3. Firmware verifies kernel before loading
4. Prevents tampering with boot media
```

---

## Troubleshooting

### Drive Not Appearing in Boot Menu

1. Ensure drive is USB 3.0+ (some USB 2.0 drives have issues)
2. Try different USB-C port
3. Verify ESP partition has correct flags
4. Check BOOTX64.EFI is at /EFI/BOOT/

### Boot Hangs at Limine

1. Press any key to interrupt timeout
2. Check limine.cfg syntax
3. Verify kernel.elf path is correct
4. Try verbose boot mode

### Kernel Panics

1. Check memory requirements (need 4GB+ free)
2. Verify model file isn't corrupted
3. Test in QEMU first
4. Enable debug output

### Slow Performance

1. Check USB connection (should show 3.0+)
2. Avoid USB hubs if possible
3. Use SSD instead of flash drive
4. Consider smaller model (1B vs 3B)

---

## Quick Reference Card

```
┌────────────────────────────────────────────────────────────────┐
│                 AlphaOS BOOT QUICK REFERENCE                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  BOOT FROM USB:                                                │
│  1. Plug in AlphaOS drive                                      │
│  2. Shut down MacBook                                          │
│  3. Hold Option + Press Power                                  │
│  4. Select "EFI Boot"                                          │
│                                                                │
│  SAFE SHUTDOWN:                                                │
│  > "Please shut down" or "Goodbye"                            │
│                                                                │
│  FORCE SHUTDOWN (if frozen):                                   │
│  Hold Power button for 10 seconds                              │
│                                                                │
│  RETURN TO macOS:                                              │
│  1. Shut down AlphaOS                                          │
│  2. Unplug AlphaOS drive                                       │
│  3. Press Power (boots macOS automatically)                    │
│                                                                │
│  MINIMUM REQUIREMENTS:                                         │
│  - 32GB USB 3.0+ drive (64GB+ recommended)                    │
│  - MacBook Pro A1706 (2016 or 2017)                           │
│  - 8GB RAM minimum                                             │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

*Document Version: 1.0*
*Last Updated: January 2026*
