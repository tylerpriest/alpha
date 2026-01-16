# AlphaOS Development Toolchain Setup

This document provides detailed instructions for setting up the development environment for AlphaOS.

---

## 1. Overview

Building AlphaOS requires a cross-compilation toolchain targeting x86_64-elf (bare metal), along with various tools for creating bootable images and testing.

### Supported Host Platforms
- Linux (Ubuntu 22.04+, Fedora 38+, Arch Linux)
- macOS (with Homebrew)
- Windows (via WSL2)

---

## 2. Quick Start (Linux/Ubuntu)

```bash
# Install all dependencies
sudo apt update
sudo apt install -y \
    build-essential \
    nasm \
    qemu-system-x86 \
    ovmf \
    mtools \
    xorriso \
    git \
    curl \
    wget

# Clone the Limine bootloader
git clone https://github.com/limine-bootloader/limine.git --branch=v7.x-binary --depth=1

# Verify installation
nasm --version
qemu-system-x86_64 --version
```

---

## 3. Cross-Compiler Options

### Option A: Use System GCC (Simpler)

For initial development, the system GCC can work with freestanding flags:

```bash
# Compile with freestanding flags
gcc -ffreestanding -fno-stack-protector -fno-pic -mno-red-zone \
    -mno-mmx -mno-sse -mno-sse2 \
    -c kernel.c -o kernel.o

# Link with explicit sections
ld -nostdlib -T linker.ld -o kernel.elf kernel.o
```

**Pros**: No setup required
**Cons**: May include host-specific assumptions

### Option B: Build Cross-Compiler (Recommended)

Building a dedicated x86_64-elf cross-compiler ensures no host contamination.

#### Prerequisites

```bash
# Ubuntu/Debian
sudo apt install -y \
    build-essential \
    bison \
    flex \
    libgmp-dev \
    libmpc-dev \
    libmpfr-dev \
    texinfo \
    libisl-dev

# Fedora
sudo dnf install -y \
    gcc gcc-c++ make \
    bison flex \
    gmp-devel mpfr-devel libmpc-devel \
    texinfo isl-devel
```

#### Build Script

```bash
#!/bin/bash
# build_cross_compiler.sh

set -e

export PREFIX="$HOME/opt/cross"
export TARGET=x86_64-elf
export PATH="$PREFIX/bin:$PATH"

BINUTILS_VERSION="2.41"
GCC_VERSION="13.2.0"

mkdir -p "$PREFIX"
mkdir -p ~/src

# Download sources
cd ~/src
if [ ! -f "binutils-${BINUTILS_VERSION}.tar.xz" ]; then
    wget "https://ftp.gnu.org/gnu/binutils/binutils-${BINUTILS_VERSION}.tar.xz"
fi
if [ ! -f "gcc-${GCC_VERSION}.tar.xz" ]; then
    wget "https://ftp.gnu.org/gnu/gcc/gcc-${GCC_VERSION}/gcc-${GCC_VERSION}.tar.xz"
fi

# Extract
tar xf "binutils-${BINUTILS_VERSION}.tar.xz"
tar xf "gcc-${GCC_VERSION}.tar.xz"

# Build binutils
mkdir -p build-binutils
cd build-binutils
../binutils-${BINUTILS_VERSION}/configure \
    --target=$TARGET \
    --prefix="$PREFIX" \
    --with-sysroot \
    --disable-nls \
    --disable-werror
make -j$(nproc)
make install
cd ..

# Build GCC
mkdir -p build-gcc
cd build-gcc
../gcc-${GCC_VERSION}/configure \
    --target=$TARGET \
    --prefix="$PREFIX" \
    --disable-nls \
    --enable-languages=c,c++ \
    --without-headers
make -j$(nproc) all-gcc
make -j$(nproc) all-target-libgcc
make install-gcc
make install-target-libgcc
cd ..

echo "Cross-compiler installed to $PREFIX"
echo "Add to PATH: export PATH=\"$PREFIX/bin:\$PATH\""
```

#### Verify Installation

```bash
export PATH="$HOME/opt/cross/bin:$PATH"

# Check version
x86_64-elf-gcc --version
x86_64-elf-ld --version

# Test compilation
echo 'void _start(void) { while(1); }' > test.c
x86_64-elf-gcc -c -ffreestanding test.c -o test.o
x86_64-elf-ld -nostdlib test.o -o test.elf
file test.elf
# Should output: test.elf: ELF 64-bit LSB executable, x86-64, ...
```

### Option C: Pre-built Cross-Compilers

Some distributions provide pre-built cross-compilers:

```bash
# Arch Linux (AUR)
yay -S x86_64-elf-gcc

# macOS (Homebrew)
brew install x86_64-elf-gcc
```

---

## 4. Assembler (NASM)

NASM is required for assembly code:

```bash
# Ubuntu/Debian
sudo apt install nasm

# Fedora
sudo dnf install nasm

# macOS
brew install nasm

# Verify
nasm --version
# NASM version 2.15.05 or higher recommended
```

---

## 5. QEMU and OVMF

### QEMU Installation

```bash
# Ubuntu/Debian
sudo apt install qemu-system-x86

# Fedora
sudo dnf install qemu-system-x86

# macOS
brew install qemu

# Verify
qemu-system-x86_64 --version
```

### OVMF (UEFI Firmware for QEMU)

```bash
# Ubuntu/Debian
sudo apt install ovmf

# Fedora
sudo dnf install edk2-ovmf

# macOS
brew install qemu  # Includes OVMF

# Locate OVMF files
find /usr -name "OVMF*.fd" 2>/dev/null
# Typical locations:
#   /usr/share/OVMF/OVMF_CODE.fd
#   /usr/share/edk2/ovmf/OVMF_CODE.fd
```

### QEMU Launch Script

```bash
#!/bin/bash
# run_qemu.sh

OVMF_CODE="/usr/share/OVMF/OVMF_CODE.fd"
OVMF_VARS="/usr/share/OVMF/OVMF_VARS.fd"
IMAGE="alphaos.img"

# Check for OVMF
if [ ! -f "$OVMF_CODE" ]; then
    OVMF_CODE="/usr/share/edk2/ovmf/OVMF_CODE.fd"
fi

qemu-system-x86_64 \
    -machine q35 \
    -cpu qemu64 \
    -m 512M \
    -drive if=pflash,format=raw,readonly=on,file="$OVMF_CODE" \
    -drive file="$IMAGE",format=raw \
    -serial stdio \
    -no-reboot \
    -no-shutdown

# Add these for debugging:
# -s -S                    # GDB server, wait for connection
# -d int,cpu_reset         # Log interrupts
# -D qemu.log              # Log to file
```

---

## 6. Bootloader (Limine)

### Download Limine

```bash
# Clone the binary release branch
git clone https://github.com/limine-bootloader/limine.git \
    --branch=v7.x-binary \
    --depth=1 \
    limine

# Build the limine utility (for installing to images)
cd limine
make

# Files we need:
# - limine/BOOTX64.EFI     (UEFI bootloader)
# - limine/BOOTIA32.EFI    (32-bit UEFI, optional)
# - limine/limine-bios.sys (BIOS bootloader, optional)
# - limine/limine          (installer utility)
```

### Limine Configuration

Create `limine.cfg`:

```ini
# limine.cfg - Limine bootloader configuration

TIMEOUT=5
VERBOSE=yes

:AlphaOS
    PROTOCOL=limine
    KERNEL_PATH=boot:///kernel.elf

# For debugging, add:
#    KERNEL_CMDLINE=debug
```

---

## 7. Image Creation Tools

### mtools (FAT filesystem manipulation)

```bash
# Ubuntu/Debian
sudo apt install mtools

# Fedora
sudo dnf install mtools

# macOS
brew install mtools
```

### xorriso (ISO creation)

```bash
# Ubuntu/Debian
sudo apt install xorriso

# Fedora
sudo dnf install xorriso

# macOS
brew install xorriso
```

### Image Creation Script

```bash
#!/bin/bash
# create_image.sh

set -e

IMAGE="alphaos.img"
IMAGE_SIZE=64  # MB

# Create empty image
dd if=/dev/zero of="$IMAGE" bs=1M count=$IMAGE_SIZE

# Create GPT partition table and ESP
parted -s "$IMAGE" mklabel gpt
parted -s "$IMAGE" mkpart ESP fat32 1MiB 100%
parted -s "$IMAGE" set 1 esp on

# Set up loop device
LOOP=$(sudo losetup -f --show -P "$IMAGE")
ESP="${LOOP}p1"

# Format ESP as FAT32
sudo mkfs.fat -F 32 "$ESP"

# Mount and copy files
mkdir -p mnt
sudo mount "$ESP" mnt

# Create directory structure
sudo mkdir -p mnt/EFI/BOOT
sudo mkdir -p mnt/boot

# Copy bootloader
sudo cp limine/BOOTX64.EFI mnt/EFI/BOOT/
sudo cp limine.cfg mnt/boot/

# Copy kernel
sudo cp kernel.elf mnt/boot/

# Unmount
sudo umount mnt
sudo losetup -d "$LOOP"

echo "Image created: $IMAGE"
```

---

## 8. Debugger (GDB)

### Installation

```bash
# Ubuntu/Debian
sudo apt install gdb

# Fedora
sudo dnf install gdb

# macOS
brew install gdb
```

### GDB Configuration

Create `.gdbinit`:

```
# .gdbinit for kernel debugging

set disassembly-flavor intel
set architecture i386:x86-64

# Connect to QEMU
define qemu
    target remote :1234
end

# Useful macros
define hook-stop
    info registers
end
```

### Debugging Session

```bash
# Terminal 1: Start QEMU with GDB server
qemu-system-x86_64 ... -s -S

# Terminal 2: Connect GDB
gdb kernel.elf
(gdb) target remote :1234
(gdb) break kmain
(gdb) continue
```

---

## 9. IDE/Editor Setup

### VS Code

Recommended extensions:
- C/C++ (Microsoft)
- x86 and x86_64 Assembly
- Makefile Tools

`settings.json`:
```json
{
    "C_Cpp.default.compilerPath": "${env:HOME}/opt/cross/bin/x86_64-elf-gcc",
    "C_Cpp.default.includePath": [
        "${workspaceFolder}/kernel/include"
    ],
    "C_Cpp.default.defines": [
        "__x86_64__"
    ]
}
```

### Vim/Neovim

```vim
" .vimrc additions for OS dev
set tabstop=4
set shiftwidth=4
set expandtab

" Assembly file type
autocmd BufRead,BufNewFile *.S set filetype=nasm
autocmd BufRead,BufNewFile *.asm set filetype=nasm
```

---

## 10. CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/build.yml
name: Build AlphaOS

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Install dependencies
      run: |
        sudo apt update
        sudo apt install -y nasm qemu-system-x86 ovmf mtools xorriso

    - name: Setup Limine
      run: |
        git clone https://github.com/limine-bootloader/limine.git --branch=v7.x-binary --depth=1
        cd limine && make

    - name: Build kernel
      run: make

    - name: Create image
      run: make image

    - name: Run tests (QEMU)
      run: |
        timeout 30 qemu-system-x86_64 \
          -machine q35 \
          -m 512M \
          -drive if=pflash,format=raw,readonly=on,file=/usr/share/OVMF/OVMF_CODE.fd \
          -drive file=alphaos.img,format=raw \
          -nographic \
          -no-reboot || true

    - name: Upload artifacts
      uses: actions/upload-artifact@v4
      with:
        name: alphaos-image
        path: alphaos.img
```

---

## 11. Troubleshooting

### Common Issues

#### "undefined reference to `__stack_chk_fail`"
```bash
# Add to CFLAGS:
-fno-stack-protector
```

#### "relocation truncated to fit"
```bash
# Ensure kernel is linked at correct address
# Check linker script and use -mcmodel=kernel if needed
```

#### QEMU hangs at "Booting from Hard Disk"
- Verify OVMF path is correct
- Check that ESP partition is properly formatted
- Ensure BOOTX64.EFI exists at /EFI/BOOT/

#### Kernel triple faults immediately
- Enable QEMU debugging: `-d int -no-reboot -no-shutdown`
- Check GDT/IDT setup
- Verify stack pointer is valid

---

## 12. Verification Checklist

Before starting development, verify:

- [ ] Cross-compiler (or system GCC) produces x86_64 ELF binaries
- [ ] NASM assembles to ELF64 format
- [ ] QEMU runs with OVMF (shows TianoCore splash)
- [ ] Limine binary branch is cloned
- [ ] mtools can manipulate FAT images
- [ ] GDB can connect to QEMU

```bash
# Quick verification script
echo "Checking toolchain..."
which nasm && nasm --version | head -1
which qemu-system-x86_64 && qemu-system-x86_64 --version | head -1
which mtools && mtools --version | head -1
which xorriso && xorriso --version 2>&1 | head -1
ls -la limine/BOOTX64.EFI 2>/dev/null || echo "Limine not found"
echo "Done!"
```

---

*Document Version: 1.0*
*Last Updated: January 2026*
