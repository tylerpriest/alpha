# AlphaOS Quick Start Guide

> Step-by-step instructions for booting AlphaOS on your MacBook Pro

## Current Status (v0.6)

**What Works:**
- Boots on MacBook Pro A1706 via USB
- Display output (2560x1600 Retina)
- Interrupt handling (IDT + PIT timer)
- Apple SPI keyboard (auto GPIO scan)
- Apple SPI trackpad with cursor
- USB keyboard fallback (xHCI)
- Local LLM (stories260K demo)

**In Progress:**
- USB Ethernet (CDC-ECM driver started)
- TCP/IP networking (IPv4 implemented)
- Claude API connectivity

## Step 1: Build the ISO

```bash
cd /home/user/alpha/os
make clean
make iso
```

This creates `build/alphaos.iso` (~4MB).

## Step 2: Prepare USB Drive

### On Linux:
```bash
# Find your USB drive (usually /dev/sdX)
lsblk

# Write ISO to USB (replace sdX with your drive!)
sudo dd if=build/alphaos.iso of=/dev/sdX bs=4M status=progress
sync
```

### On macOS:
```bash
# Find your USB drive
diskutil list

# Unmount it (replace diskN with your disk number)
diskutil unmountDisk /dev/diskN

# Write ISO
sudo dd if=build/alphaos.iso of=/dev/rdiskN bs=4m
diskutil eject /dev/diskN
```

## Step 3: Boot on MacBook

1. **Shut down** your MacBook completely
2. **Insert USB drive**
3. **Power on** while holding **Option (⌥)** key
4. Wait for boot menu to appear (~5-10 seconds)
5. Select **"EFI Boot"** or the USB drive icon
6. Press **Enter**

## Step 4: First Boot

You should see:
```
╔═══════════════════════════════════════════════════╗
║                   AlphaOS v0.6                     ║
║           AI-Native Operating System               ║
╚═══════════════════════════════════════════════════╝

[  OK  ] Framebuffer initialized (2560x1600)
[  OK  ] IDT initialized
[  OK  ] PIT timer at 100 Hz
[  OK  ] Heap initialized (256 MB)
[  OK  ] FPU/SSE enabled
[INFO ] Apple SPI: Scanning GPIO pins...
    Pin 43: FOUND!
[  OK  ] Internal keyboard ready (Apple SPI)
[  OK  ] Internal trackpad ready (Apple SPI)
...

  Talk to me or type 'help' for commands.

  alpha>
```

## Step 5: Basic Commands

| Command | Description |
|---------|-------------|
| `help` | Show available commands |
| `ai <prompt>` | Ask the local LLM |
| `info` | Show system information |
| `clear` | Clear the screen |
| `pci` | List PCI devices |
| `acpi` | Dump ACPI tables |

## Troubleshooting

### "No keyboard found"
- The GPIO pin scan didn't find your keyboard
- Try: `gpio 47` then type on keyboard
- Try other pins: 43, 47, 19, 67, 91, 144

### USB drive not showing in boot menu
- Make sure drive is GPT formatted
- Try a different USB port
- Try a different USB drive

### Black screen after selecting USB
- UEFI may be failing
- Check if Limine installed correctly
- Rebuild: `make clean && make iso`

### Kernel panic / crash
- Take a photo of the error message
- Check exception info (vector number)
- Report issue with details

## Known Limitations

1. **No Networking Yet** - Can't connect to Claude API
2. **No Storage** - Can't save files to disk
3. **No WiFi** - BCM43xx driver not implemented
4. **No Bluetooth** - Not implemented

## Next Steps

Once networking is complete:
1. Connect USB Ethernet adapter
2. Get IP via DHCP
3. Connect to Claude API
4. Full Claude Code experience!

## Getting Help

- GitHub Issues: https://github.com/tylerpriest/alpha/issues
- Check `os/IMPLEMENTATION_PLAN.md` for detailed status
- Review specs in `os/specs/` directory
