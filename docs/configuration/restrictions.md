# Restrictions

Restrictions can be defined in the `config.yaml` file to restrict access to control certain widgets. We support two types of restrictions: PIN-based or confirmation-based.

PIN-based restrictions require the user to enter a PIN code to perform the action. Confirmation-based restrictions simply ask the user to confirm they want to perform the action.

## Example Configuration

```yaml
restrictions:
  # Each restriction is defined by a unique key. This key is used to reference the restriction in each widget.
  child-lock:
    # Friendly name of the restriction. This is displayed in the PIN entry dialog.
    name: Child Lock
    # Conditions that must be met for the restriction to be applied. If no conditions are specified, the restriction will always be applied.
    conditions:
      - entity: input_boolean.child_lock
        state: 'on'
    # Type of restriction. Can be either 'pin' or 'confirm'. For this example, we use 'pin'.
    pin:
      # Message to display in the PIN entry dialog.
      message: Please enter the super secret PIN
      # PIN code to unlock the restriction. Must be numeric. No character limit.
      code: 1234
    # Time (in seconds) that the restriction will remain unlocked after a successful PIN entry.
    # If not specified, the restriction will immediately re-lock after the action is performed.
    unlock_time: 5
  # A sample confirmation-based restriction.
  # Confirm restrictions also support conditions and unlock_time, but are not shown in this example.
  confirm:
    name: Simple Confirmation
    # Type of restriction. Can be either 'pin' or 'confirm'. For this example, we use 'confirm'.
    confirm:
      # Message to display in the confirmation dialog.
      message: Are you sure you want to perform this action?
```
