# AlphaOS - Makefile
# AI-Native Operating System for MacBook Pro A1706

# Directories
KERNEL_DIR := kernel
SRC_DIR := $(KERNEL_DIR)/src
INC_DIR := $(KERNEL_DIR)/include
BUILD_DIR := build
ISO_DIR := $(BUILD_DIR)/iso_root

# Output files
KERNEL := $(BUILD_DIR)/kernel.elf
ISO := $(BUILD_DIR)/alphaos.iso

# Toolchain - try cross-compiler first, fall back to system
ifneq ($(shell which x86_64-elf-gcc 2>/dev/null),)
    CC := x86_64-elf-gcc
    LD := x86_64-elf-ld
else
    CC := gcc
    LD := ld
endif

NASM := nasm

# Compiler flags
CFLAGS := -std=gnu11 \
          -ffreestanding \
          -fno-stack-protector \
          -fno-stack-check \
          -fno-lto \
          -fno-PIC \
          -fno-PIE \
          -m64 \
          -march=x86-64 \
          -mno-80387 \
          -mno-mmx \
          -msse \
          -msse2 \
          -mno-red-zone \
          -mcmodel=kernel \
          -I$(INC_DIR) \
          -Wall \
          -Wextra \
          -O2

# Linker flags
LDFLAGS := -nostdlib \
           -static \
           -m elf_x86_64 \
           -z max-page-size=0x1000 \
           -T $(KERNEL_DIR)/linker.ld

# Source files
C_SOURCES := $(wildcard $(SRC_DIR)/*.c)
ASM_SOURCES := $(wildcard $(KERNEL_DIR)/arch/x86_64/*.S)

# Object files
C_OBJECTS := $(patsubst $(SRC_DIR)/%.c,$(BUILD_DIR)/%.o,$(C_SOURCES))
ASM_OBJECTS := $(patsubst $(KERNEL_DIR)/arch/x86_64/%.S,$(BUILD_DIR)/%.o,$(ASM_SOURCES))
OBJECTS := $(C_OBJECTS) $(ASM_OBJECTS)

# Limine bootloader
LIMINE_DIR := limine
LIMINE_CFG := boot/limine.conf

# QEMU settings
QEMU := qemu-system-x86_64
OVMF := /usr/share/OVMF/OVMF_CODE.fd
OVMF_ALT := /usr/share/edk2/ovmf/OVMF_CODE.fd
OVMF_ALT2 := /usr/share/qemu/OVMF_CODE.fd
OVMF_ALT3 := /usr/share/OVMF/OVMF_CODE_4M.fd
OVMF_ALT4 := /usr/share/ovmf/OVMF.fd

# Default target
.PHONY: all
all: $(KERNEL)

# Build kernel
$(KERNEL): $(OBJECTS) | $(BUILD_DIR)
	@echo "  LD      $@"
	@$(LD) $(LDFLAGS) -o $@ $(OBJECTS)
	@echo ""
	@echo "Kernel built successfully: $@"
	@echo "Size: $$(du -h $@ | cut -f1)"

# Compile C sources
$(BUILD_DIR)/%.o: $(SRC_DIR)/%.c | $(BUILD_DIR)
	@echo "  CC      $<"
	@$(CC) $(CFLAGS) -c $< -o $@

# Compile assembly sources
$(BUILD_DIR)/%.o: $(KERNEL_DIR)/arch/x86_64/%.S | $(BUILD_DIR)
	@echo "  AS      $<"
	@$(NASM) -f elf64 $< -o $@

# Create build directory
$(BUILD_DIR):
	@mkdir -p $(BUILD_DIR)

# Clone Limine if not present
$(LIMINE_DIR):
	@echo "Cloning Limine bootloader..."
	git clone https://github.com/limine-bootloader/limine.git --branch=v8.x-binary --depth=1 $(LIMINE_DIR)
	$(MAKE) -C $(LIMINE_DIR)

# Build ISO image
.PHONY: iso
iso: $(ISO)

$(ISO): $(KERNEL) $(LIMINE_DIR) | $(BUILD_DIR)
	@echo ""
	@echo "Creating bootable ISO..."
	@rm -rf $(ISO_DIR)
	@mkdir -p $(ISO_DIR)/boot/limine
	@mkdir -p $(ISO_DIR)/EFI/BOOT

	# Copy kernel
	@cp $(KERNEL) $(ISO_DIR)/boot/

	# Copy Limine files
	@cp $(LIMINE_CFG) $(ISO_DIR)/boot/limine/
	@cp $(LIMINE_DIR)/limine-bios.sys $(ISO_DIR)/boot/limine/ 2>/dev/null || true
	@cp $(LIMINE_DIR)/limine-bios-cd.bin $(ISO_DIR)/boot/limine/ 2>/dev/null || true
	@cp $(LIMINE_DIR)/limine-uefi-cd.bin $(ISO_DIR)/boot/limine/ 2>/dev/null || true
	@cp $(LIMINE_DIR)/BOOTX64.EFI $(ISO_DIR)/EFI/BOOT/
	@cp $(LIMINE_DIR)/BOOTIA32.EFI $(ISO_DIR)/EFI/BOOT/ 2>/dev/null || true

	# Create ISO
	@xorriso -as mkisofs -b boot/limine/limine-bios-cd.bin \
		-no-emul-boot -boot-load-size 4 -boot-info-table \
		--efi-boot boot/limine/limine-uefi-cd.bin \
		-efi-boot-part --efi-boot-image --protective-msdos-label \
		$(ISO_DIR) -o $(ISO) 2>/dev/null

	# Install Limine (for BIOS boot)
	@$(LIMINE_DIR)/limine bios-install $(ISO) 2>/dev/null || true

	@echo ""
	@echo "ISO created successfully: $(ISO)"
	@echo "Size: $$(du -h $(ISO) | cut -f1)"

# Build ISO with AI model
.PHONY: iso-with-model
iso-with-model: $(KERNEL) $(LIMINE_DIR) | $(BUILD_DIR)
	@echo ""
	@echo "Creating bootable ISO with AI model..."
	@rm -rf $(ISO_DIR)
	@mkdir -p $(ISO_DIR)/boot/limine
	@mkdir -p $(ISO_DIR)/EFI/BOOT

	# Copy kernel
	@cp $(KERNEL) $(ISO_DIR)/boot/

	# Copy AI model if present
	@if [ -f "models/model.bin" ]; then \
		cp models/model.bin $(ISO_DIR)/boot/; \
		echo "  Including AI model: $$(du -h models/model.bin | cut -f1)"; \
	else \
		echo "  Warning: models/model.bin not found"; \
		echo "  Run: ./scripts/download_model.sh"; \
	fi

	# Copy tokenizer if present
	@if [ -f "models/tokenizer.bin" ]; then \
		cp models/tokenizer.bin $(ISO_DIR)/boot/; \
		echo "  Including tokenizer: $$(du -h models/tokenizer.bin | cut -f1)"; \
	else \
		echo "  Warning: models/tokenizer.bin not found"; \
	fi

	# Copy Limine files
	@cp $(LIMINE_CFG) $(ISO_DIR)/boot/limine/
	@cp $(LIMINE_DIR)/limine-bios.sys $(ISO_DIR)/boot/limine/ 2>/dev/null || true
	@cp $(LIMINE_DIR)/limine-bios-cd.bin $(ISO_DIR)/boot/limine/ 2>/dev/null || true
	@cp $(LIMINE_DIR)/limine-uefi-cd.bin $(ISO_DIR)/boot/limine/ 2>/dev/null || true
	@cp $(LIMINE_DIR)/BOOTX64.EFI $(ISO_DIR)/EFI/BOOT/
	@cp $(LIMINE_DIR)/BOOTIA32.EFI $(ISO_DIR)/EFI/BOOT/ 2>/dev/null || true

	# Create ISO
	@xorriso -as mkisofs -b boot/limine/limine-bios-cd.bin \
		-no-emul-boot -boot-load-size 4 -boot-info-table \
		--efi-boot boot/limine/limine-uefi-cd.bin \
		-efi-boot-part --efi-boot-image --protective-msdos-label \
		$(ISO_DIR) -o $(ISO) 2>/dev/null

	# Install Limine (for BIOS boot)
	@$(LIMINE_DIR)/limine bios-install $(ISO) 2>/dev/null || true

	@echo ""
	@echo "ISO created successfully: $(ISO)"
	@echo "Size: $$(du -h $(ISO) | cut -f1)"

# Download AI model
.PHONY: download-model
download-model:
	@./scripts/download_model.sh stories15M

# Run in QEMU (UEFI mode)
.PHONY: run
run: $(ISO)
	@echo ""
	@echo "Starting QEMU (UEFI mode)..."
	@OVMF_PATH=""; \
	if [ -f "$(OVMF)" ]; then OVMF_PATH="$(OVMF)"; \
	elif [ -f "$(OVMF_ALT)" ]; then OVMF_PATH="$(OVMF_ALT)"; \
	elif [ -f "$(OVMF_ALT2)" ]; then OVMF_PATH="$(OVMF_ALT2)"; \
	elif [ -f "$(OVMF_ALT3)" ]; then OVMF_PATH="$(OVMF_ALT3)"; \
	elif [ -f "$(OVMF_ALT4)" ]; then OVMF_PATH="$(OVMF_ALT4)"; \
	else echo "ERROR: OVMF not found. Install with: sudo apt install ovmf"; exit 1; \
	fi; \
	$(QEMU) \
		-machine q35 \
		-cpu qemu64 \
		-m 512M \
		-drive if=pflash,format=raw,readonly=on,file=$$OVMF_PATH \
		-cdrom $(ISO) \
		-serial stdio \
		-no-reboot \
		-no-shutdown

# Run with debugging enabled
.PHONY: debug
debug: $(ISO)
	@echo ""
	@echo "Starting QEMU with GDB server (port 1234)..."
	@OVMF_PATH=""; \
	if [ -f "$(OVMF)" ]; then OVMF_PATH="$(OVMF)"; \
	elif [ -f "$(OVMF_ALT)" ]; then OVMF_PATH="$(OVMF_ALT)"; \
	elif [ -f "$(OVMF_ALT2)" ]; then OVMF_PATH="$(OVMF_ALT2)"; \
	elif [ -f "$(OVMF_ALT3)" ]; then OVMF_PATH="$(OVMF_ALT3)"; \
	elif [ -f "$(OVMF_ALT4)" ]; then OVMF_PATH="$(OVMF_ALT4)"; \
	else echo "ERROR: OVMF not found."; exit 1; \
	fi; \
	$(QEMU) \
		-machine q35 \
		-cpu qemu64 \
		-m 512M \
		-drive if=pflash,format=raw,readonly=on,file=$$OVMF_PATH \
		-cdrom $(ISO) \
		-serial stdio \
		-no-reboot \
		-no-shutdown \
		-s -S

# Run in BIOS mode (fallback)
.PHONY: run-bios
run-bios: $(ISO)
	@echo ""
	@echo "Starting QEMU (BIOS mode)..."
	$(QEMU) \
		-machine q35 \
		-cpu qemu64 \
		-m 512M \
		-cdrom $(ISO) \
		-serial stdio \
		-no-reboot \
		-no-shutdown

# Clean build artifacts
.PHONY: clean
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf $(BUILD_DIR)
	@echo "Done."

# Deep clean (including Limine)
.PHONY: distclean
distclean: clean
	@echo "Removing Limine..."
	@rm -rf $(LIMINE_DIR)
	@echo "Done."

# Show help
.PHONY: help
help:
	@echo ""
	@echo "AlphaOS Build System"
	@echo "===================="
	@echo ""
	@echo "Targets:"
	@echo "  all            - Build kernel (default)"
	@echo "  iso            - Build bootable ISO (no AI model)"
	@echo "  iso-with-model - Build ISO with AI model"
	@echo "  download-model - Download TinyStories 15M model"
	@echo "  run            - Build and run in QEMU (UEFI)"
	@echo "  run-bios       - Build and run in QEMU (BIOS)"
	@echo "  debug          - Run with GDB debugging"
	@echo "  clean          - Remove build artifacts"
	@echo "  distclean      - Remove everything including Limine"
	@echo "  help           - Show this help"
	@echo ""
	@echo "AI Model Setup:"
	@echo "  1. make download-model   # Downloads ~30MB model"
	@echo "  2. make iso-with-model   # Creates ISO with model"
	@echo "  3. Write ISO to USB and boot"
	@echo ""
	@echo "Requirements:"
	@echo "  - gcc or x86_64-elf-gcc"
	@echo "  - nasm"
	@echo "  - xorriso"
	@echo "  - qemu-system-x86"
	@echo "  - ovmf (for UEFI boot)"
	@echo ""

# Print configuration
.PHONY: info
info:
	@echo ""
	@echo "AlphaOS Build Configuration"
	@echo "==========================="
	@echo "CC:       $(CC)"
	@echo "LD:       $(LD)"
	@echo "NASM:     $(NASM)"
	@echo "QEMU:     $(QEMU)"
	@echo "Sources:  $(C_SOURCES)"
	@echo "Objects:  $(OBJECTS)"
	@echo ""
