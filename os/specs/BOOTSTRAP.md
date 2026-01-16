# Self-Bootstrapping Specification

> **Topic:** Toolchain and build system for self-compilation

## Job To Be Done

Enable AlphaOS to compile itself from source, creating a fully self-hosted development environment where the OS can evolve and rebuild without external tools.

## Requirements

### C Compiler (TinyCC-based)
1. **C11 subset support**
2. **x86_64 code generation**
3. **Preprocessor** (#include, #define, #ifdef)
4. **Standard headers** (subset)
5. **ELF64 output**

### Assembler
1. **x86_64 instruction encoding**
2. **AT&T or Intel syntax**
3. **ELF64 object output**

### Linker
1. **ELF64 object linking**
2. **Symbol resolution**
3. **Relocation processing**
4. **Linker script support**

### Build System
1. **Make-compatible** build tool
2. **Dependency tracking**
3. **Incremental builds**
4. **Parallel compilation** (future)

### Version Control
1. **Git client** (minimal subset)
2. **clone, pull, commit, push**
3. **Diff viewing**

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 AlphaOS Shell                   │
├─────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │  make   │  │   git   │  │  edit   │         │
│  └────┬────┘  └────┬────┘  └────┬────┘         │
│       │            │            │               │
│       └────────────┼────────────┘               │
│                    │                            │
│  ┌─────────────────┴──────────────────┐        │
│  │            Toolchain               │        │
│  │  ┌─────┐  ┌─────┐  ┌─────┐        │        │
│  │  │ tcc │  │ as  │  │ ld  │        │        │
│  │  └──┬──┘  └──┬──┘  └──┬──┘        │        │
│  │     │        │        │            │        │
│  │     └────────┼────────┘            │        │
│  │              │                     │        │
│  │     ┌────────┴────────┐            │        │
│  │     │  ELF64 Output   │            │        │
│  │     └─────────────────┘            │        │
│  └────────────────────────────────────┘        │
│                    │                            │
├────────────────────┼────────────────────────────┤
│            Filesystem (FAT32)                   │
│      /src  /boot  /bin  /lib  /include          │
└─────────────────────────────────────────────────┘
```

## TinyCC Integration

### Why TinyCC?
- **Small:** ~100KB compiled size
- **Fast:** Single-pass compilation
- **Self-hosting:** Can compile itself
- **Portable:** Minimal dependencies
- **License:** LGPL (acceptable)

### TinyCC Subset for AlphaOS
```c
// Features needed:
- Integer types (char, short, int, long, long long)
- Floating point (float, double)
- Pointers and arrays
- Structs and unions
- Enums
- Functions with prototypes
- Control flow (if, while, for, switch)
- Preprocessor (#include, #define, #ifdef, #ifndef)
- Basic optimization (-O1)

// Features NOT needed initially:
- Full C11 atomics
- Complex numbers
- Variable-length arrays
- Full standard library
```

### Minimal libc for Toolchain
```c
// String functions
void* memcpy(void* dst, const void* src, size_t n);
void* memset(void* s, int c, size_t n);
size_t strlen(const char* s);
char* strcpy(char* dst, const char* src);
int strcmp(const char* s1, const char* s2);

// I/O functions (custom for AlphaOS)
int open(const char* path, int flags);
int read(int fd, void* buf, size_t count);
int write(int fd, const void* buf, size_t count);
int close(int fd);

// Memory
void* malloc(size_t size);
void free(void* ptr);
void* realloc(void* ptr, size_t size);

// Process (simplified)
void exit(int status);
```

## Build System (alpha-make)

### Makefile Compatibility
```makefile
# AlphaOS Makefile - works with alpha-make
CC = tcc
LD = ld

CFLAGS = -Wall -O1

OBJS = main.o console.o heap.o

kernel.elf: $(OBJS)
    $(LD) -o $@ $(OBJS)

%.o: %.c
    $(CC) $(CFLAGS) -c $< -o $@

clean:
    rm -f $(OBJS) kernel.elf
```

### alpha-make Features
1. Read Makefile
2. Build dependency graph
3. Check file timestamps
4. Execute commands
5. Handle variables

## Git Client (alpha-git)

### Minimal Commands
```bash
# Clone repository
alpha-git clone https://github.com/user/repo.git

# Update from remote
alpha-git pull

# Stage changes
alpha-git add file.c

# Commit
alpha-git commit -m "message"

# Push (requires auth)
alpha-git push
```

### Git Internals Needed
1. Object storage (blob, tree, commit)
2. Index file parsing
3. Pack file reading
4. HTTP(S) smart protocol
5. Delta compression (for clone)

## Bootstrap Sequence

### Stage 1: Initial Build (External)
```bash
# On development machine
make iso-with-model
# Write to USB
dd if=build/alphaos.iso of=/dev/sdX
```

### Stage 2: First Boot
```bash
# On MacBook - boots from USB
# Mount internal NVMe
mount /dev/nvme0n1p1 /mnt

# Copy AlphaOS source to NVMe
cp -r /usb/src/* /mnt/src/
```

### Stage 3: Build Toolchain
```bash
# Build TinyCC first (it can self-compile)
cd /mnt/src/toolchain/tcc
./configure
./tcc -o tcc tcc.c

# Build assembler
./tcc -o as as.c

# Build linker
./tcc -o ld ld.c
```

### Stage 4: Self-Compilation
```bash
# Build AlphaOS with native toolchain
cd /mnt/src
make CC=/mnt/bin/tcc

# Install to boot partition
cp build/kernel.elf /mnt/boot/
```

### Stage 5: Reboot into Self-Built System
```bash
reboot
# System now runs self-compiled kernel
```

## Acceptance Criteria

- [ ] TinyCC ported and compiling C code
- [ ] Assembler producing valid ELF64 objects
- [ ] Linker producing working executables
- [ ] alpha-make building from Makefiles
- [ ] Can compile a simple "hello world" program
- [ ] Can compile the AlphaOS kernel
- [ ] Self-compiled kernel boots successfully
- [ ] alpha-git can clone repositories

## Dependencies

- Filesystem (FAT32 or ext4) - for source storage
- Networking (HTTPS) - for git clone
- Memory allocator (done)
- Console I/O (done)

## Files to Create

```
toolchain/
├── tcc/
│   ├── tcc.c           # Main compiler
│   ├── libtcc.c        # Library interface
│   ├── tccgen.c        # Code generator
│   ├── x86_64-gen.c    # x86_64 backend
│   ├── tccpp.c         # Preprocessor
│   ├── tccelf.c        # ELF output
│   └── include/        # Standard headers
├── as/
│   └── as.c            # Assembler
├── ld/
│   └── ld.c            # Linker
├── make/
│   └── make.c          # Build system
├── git/
│   ├── git.c           # Main git client
│   ├── objects.c       # Object storage
│   └── protocol.c      # HTTP protocol
└── libc/
    ├── string.c        # String functions
    ├── stdio.c         # I/O functions
    ├── stdlib.c        # Memory, etc.
    └── syscall.c       # System calls
```

## Future: Full Self-Hosting

Once basic self-compilation works:

1. **Full libc** - POSIX compatibility
2. **Shell** - bash-like interpreter
3. **Editor** - vim or nano port
4. **Debugger** - gdb subset
5. **Package manager** - for dependencies

This enables AlphaOS to be a complete development environment.
