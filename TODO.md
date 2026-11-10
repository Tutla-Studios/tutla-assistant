# Porting TODO (main → v3)

Everything from `modules/Cogs/*`, `modules/CLIENT/help.py`, `modules/AdvancedCogs/*` and the
command-check / daily-loop behaviour of `main.py` + `Module.py` is ported. What's left:

## `mods/` (message-event plugins)
- [ ] `mod.py` – plugin framework (`on_message` / `on_delete` / `on_edit` / `mainloop` hooks); `/list mods` currently reports none
- [ ] `SniperMod.py` – snipe / edit-snipe deleted and edited messages
- [ ] `ClickCrystalsBot.py` – auto-replies for the ClickCrystals server (crash-report help, etc.)
- [ ] `sudo.py` – text "terminal" command

## Not ported on purpose
- `/panel shell execute …` – ran arbitrary Python `exec()`; v3's shell only offers `ldb`, `stats`, `sp` (restart)
- The stdin "Tutla Shell" thread in `main.py` (same reason; there's no interactive stdin in Docker)
