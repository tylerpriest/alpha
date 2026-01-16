/*
 * AlphaOS - WiFi Driver Interface
 *
 * Broadcom BCM43xx (BCM4350) for MacBook Pro.
 */

#ifndef _WIFI_H
#define _WIFI_H

#include "types.h"
#include "pci.h"

/* WiFi states */
typedef enum {
    WIFI_STATE_OFF,
    WIFI_STATE_SCANNING,
    WIFI_STATE_CONNECTING,
    WIFI_STATE_CONNECTED,
    WIFI_STATE_ERROR
} WifiState;

/* WiFi network info */
typedef struct {
    char ssid[33];          /* Network name (32 chars + null) */
    u8 bssid[6];            /* Access point MAC */
    i8 rssi;                /* Signal strength (dBm) */
    u8 channel;
    bool encrypted;         /* WPA/WPA2 */
} WifiNetwork;

/* WiFi connection parameters */
typedef struct {
    char ssid[33];
    char password[64];
    u8 security;            /* 0=open, 1=WPA, 2=WPA2 */
} WifiConnectParams;

/* Initialize WiFi subsystem */
int wifi_init(void);

/* Scan for networks */
int wifi_scan(WifiNetwork* networks, u32 max_count);

/* Connect to network */
int wifi_connect(const WifiConnectParams* params);

/* Disconnect */
void wifi_disconnect(void);

/* Get current state */
WifiState wifi_get_state(void);

/* Get current network info (when connected) */
int wifi_get_current_network(WifiNetwork* network);

/* Check if connected */
bool wifi_is_connected(void);

/* Get assigned IP address */
u32 wifi_get_ip(void);

/* Send packet */
int wifi_send(const void* data, u32 len);

/* Receive packet */
int wifi_recv(void* buffer, u32 max_len);

/* Poll for activity */
void wifi_poll(void);

#endif /* _WIFI_H */
