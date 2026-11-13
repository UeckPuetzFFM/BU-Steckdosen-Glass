# Steckdosen Glass Card

Eigenständige Home Assistant Lovelace Custom Card zum Ein- und Ausschalten von `switch`-Entitäten.

## Funktionen
- Ein-/Ausschalten über eine große runde Schaltfläche
- Dunkles Glass-Design passend zur Light Glass Card
- Optionale Sensoren für Leistung (W), Tagesenergie (kWh) und Spannung (V)
- Messwerte werden ausschließlich bei eingeschalteter Steckdose angezeigt
- Nicht konfigurierte, unbekannte oder nicht verfügbare Sensoren werden ausgeblendet
- Konfigurationseditor für Steckdose, Namen, Sensoren und Kartenbreite

## Installation
1. Lege den Ordner `steckdosen-glass-card` unter `/config/www/community/` an.
2. Kopiere `steckdosen-glass-card.js` hinein.
3. Füge unter **Einstellungen → Dashboards → Ressourcen** diese Ressource hinzu:
   `/local/community/steckdosen-glass-card/steckdosen-glass-card.js`
4. Wähle **JavaScript-Modul** als Ressourcentyp.
5. Dashboard neu laden und eine manuelle Karte mit Typ `custom:steckdosen-glass-card` hinzufügen.

## YAML-Beispiel
```yaml
type: custom:steckdosen-glass-card
entity: switch.steckdose_tv
group_name: Wohnzimmer
name: Steckdose TV
power_sensor: sensor.steckdose_tv_power
energy_sensor: sensor.steckdose_tv_energy_today
voltage_sensor: sensor.steckdose_tv_voltage
card_width: auto
```

Sensoren sind optional. Der Energie-Sensor sollte den Tagesverbrauch in kWh liefern; die Karte setzt den Zähler nicht selbst zurück. Die Karte verwendet `switch.turn_on` und `switch.turn_off`.
