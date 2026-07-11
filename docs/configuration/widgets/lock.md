# Lock Widget

Displays and controls a lock entity. Shows the current lock state with an appropriate icon. Tapping toggles between locked and unlocked.

**Default size:** 2×2

```yaml
type: lock
entity: lock.front_door
title: Front Door
```

## Properties

This widget has no widget-specific config keys beyond the [common properties](index.md#common-properties).

## States

The widget icon and styling reflect the following lock states:

| State | Description |
|-------|-------------|
| `locked` | Lock is secured |
| `unlocked` | Lock is open |
| `locking` | Lock is in the process of locking |
| `unlocking` | Lock is in the process of unlocking |
| `jammed` | Lock is jammed and cannot complete an operation |

## Default Behavior

- **Tap**: calls `lock.lock` when unlocked, `lock.unlock` when locked
- **Long press**: opens the more-info dialog

Use `restriction` to require a PIN or confirmation before the lock can be toggled:

```yaml
type: lock
entity: lock.front_door
title: Front Door
restriction: confirm_unlock
```

See [Restrictions](../restrictions.md) for setup details.

## Examples

**Basic lock:**
```yaml
type: lock
entity: lock.front_door
title: Front Door
```

**Lock with confirmation required:**
```yaml
type: lock
entity: lock.garage_side_door
title: Garage Door
restriction: confirm
```

**Custom colors by state:**
```yaml
type: lock
entity: lock.back_door
title: Back Door
icon_color:
  locked: "#43a047"
  unlocked: "#e53935"
  jammed: "#fb8c00"
  default: "rgba(255,255,255,0.5)"
```
