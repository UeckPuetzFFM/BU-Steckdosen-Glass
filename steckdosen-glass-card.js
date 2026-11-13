/* Steckdosen Glass Card v1.2.0
 * Filigrane Lovelace-Karte für switch-Entitäten mit optionalen Messwerten.
 */
class SteckdosenGlassCard extends HTMLElement {
  static getStubConfig() {
    return { type: "custom:steckdosen-glass-card", entity: "switch.steckdose",
      group_name: "Wohnzimmer", name: "Steckdose TV", card_width: "auto" };
  }

  setConfig(config) {
    if (!config?.entity) throw new Error("Steckdosen Glass Card: Bitte eine switch-Entität angeben.");
    this.config = {
      group_name: "Steckdose", name: "", card_width: "auto",
      show_power: true, show_energy: true, show_voltage: true,
      show_settings: true, ...config
    };
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._lastSignature = null;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.config || !this.shadowRoot) return;
    const ids = [this.config.entity, this.config.power_sensor, this.config.energy_sensor, this.config.voltage_sensor].filter(Boolean);
    const sig = ids.map(id => {
      const s = hass?.states?.[id];
      return s ? `${id}:${s.state}:${s.attributes?.unit_of_measurement ?? ""}` : `${id}:missing`;
    }).join("|");
    if (sig !== this._lastSignature) { this._lastSignature = sig; this._render(); }
  }

  getCardSize() { return 2; }
  _esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  }
  _sensor(id, fallbackUnit) {
    if (!id) return null;
    const s = this._hass?.states?.[id];
    if (!s || ["unknown", "unavailable", ""].includes(String(s.state).toLowerCase())) return null;
    const n = Number(s.state);
    if (!Number.isFinite(n)) return null;
    const unit = s.attributes?.unit_of_measurement || fallbackUnit || "";
    const digits = Math.abs(n) >= 100 ? 0 : Math.abs(n) >= 10 ? 1 : 2;
    return { value: n.toLocaleString("de-DE", { maximumFractionDigits: digits }), unit };
  }

  _render() {
    if (!this.shadowRoot || !this.config) return;
    const c = this.config, socket = this._hass?.states?.[c.entity];
    if (!socket) {
      this.shadowRoot.innerHTML = `<style>:host{display:block}.missing{padding:14px;color:var(--error-color,#db4437)}</style><ha-card><div class="missing">Steckdosen-Entität nicht gefunden: ${this._esc(c.entity)}</div></ha-card>`;
      return;
    }
    const on = socket.state === "on";
    const group = c.group_name || "Steckdose";
    const name = c.name || socket.attributes?.friendly_name || "Steckdose";
    const width = c.card_width === "auto" ? "100%" : `${Math.max(250, Math.min(1200, Number(c.card_width) || 400))}px`;
    const metricDefs = [
      { key:"power", sensor:c.power_sensor, label:"Leistung", icon:"mdi:flash", unit:"W", enabled:c.show_power !== false },
      { key:"energy", sensor:c.energy_sensor, label:"Heute", icon:"mdi:chart-line", unit:"kWh", enabled:c.show_energy !== false },
      { key:"voltage", sensor:c.voltage_sensor, label:"Spannung", icon:"mdi:sine-wave", unit:"V", enabled:c.show_voltage !== false }
    ];
    const metrics = on ? metricDefs.filter(m => m.enabled).map(m => ({...m, data:this._sensor(m.sensor,m.unit)})).filter(m => m.data) : [];
    const settingsOpen = this._settingsOpen === true;
    const visibility = this._metricVisibility || { power:true, energy:true, voltage:true };
    const shownMetrics = metrics.filter(m => visibility[m.key]);

    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;width:100%;color:#f4f1ee}
        ha-card{width:${width};max-width:100%;box-sizing:border-box;margin:0;padding:0;border-radius:18px;
          background:linear-gradient(145deg,rgba(43,42,42,.95),rgba(23,23,24,.97));
          border:1px solid rgba(255,255,255,.15);
          box-shadow:0 4px 13px rgba(0,0,0,.23),inset 0 1px 2px rgba(255,255,255,.11),inset 0 -2px 4px rgba(0,0,0,.38);
          overflow:hidden;-webkit-backdrop-filter:blur(20px) saturate(115%);backdrop-filter:blur(20px) saturate(115%)}
        .shell{padding:8px 10px 9px;position:relative}
        .shell:before{content:"";position:absolute;inset:3px;border-radius:15px;border:1px solid rgba(255,255,255,.045);pointer-events:none}
        .top{display:flex;align-items:center;justify-content:space-between;gap:7px;margin:0 4px 7px;position:relative;z-index:1}
        .heading{font-size:clamp(15px,2.2vw,18px);font-weight:680;line-height:1.12;letter-spacing:-.2px;color:#f8f6f3}
        .top-right{display:flex;align-items:center;gap:7px}
        .state{font-size:9px;font-weight:700;letter-spacing:.45px;padding:3px 7px;border-radius:99px;
          color:${on ? "#ffc18c" : "#c7c4c3"};background:${on ? "rgba(255,177,112,.12)" : "rgba(255,255,255,.055)"};
          border:1px solid ${on ? "rgba(255,190,137,.30)" : "rgba(255,255,255,.11)"}}
        .gear{width:23px;height:23px;display:grid;place-items:center;border-radius:50%;border:1px solid rgba(255,255,255,.14);
          color:#c9c4bf;background:rgba(255,255,255,.055);cursor:pointer;padding:0;transition:background .2s,transform .2s}
        .gear:hover{background:rgba(255,255,255,.12)}.gear:active{transform:rotate(25deg) scale(.94)}
        .gear ha-icon{--mdc-icon-size:14px}
        .device{min-height:54px;display:flex;align-items:center;gap:9px;padding:4px 9px 4px 4px;border-radius:999px;
          background:linear-gradient(180deg,rgba(210,205,199,.24),rgba(95,91,88,.22) 18%,rgba(48,47,47,.82) 100%);
          border:1px solid rgba(239,235,230,.29);
          box-shadow:inset 0 1px 2px rgba(255,255,255,.25),inset 0 -2px 4px rgba(0,0,0,.45),0 2px 5px rgba(0,0,0,.20);
          position:relative;overflow:hidden;z-index:1}
        .device:after{content:"";position:absolute;inset:2px;border-radius:inherit;border:1px solid rgba(255,255,255,.05);pointer-events:none}
        .toggle{width:43px;height:43px;flex:none;border-radius:50%;display:grid;place-items:center;cursor:pointer;padding:0;
          color:${on ? "#ffc18d" : "#e5e2df"};
          background:linear-gradient(145deg,rgba(225,222,218,.35),rgba(83,81,80,.36) 48%,rgba(36,35,35,.76));
          border:1px solid rgba(255,255,255,.23);
          box-shadow:inset 0 1px 3px rgba(255,255,255,.31),inset 0 -3px 5px rgba(0,0,0,.40),0 1px 4px rgba(0,0,0,.22);
          position:relative;z-index:1;transition:transform .16s,box-shadow .25s,color .25s}
        .toggle:active{transform:scale(.94)}
        .toggle ha-icon{--mdc-icon-size:21px;filter:${on ? "drop-shadow(0 0 5px rgba(255,170,98,.55))" : "none"}}
        .device.is-on .toggle{animation:softPulse 3.8s ease-in-out infinite}
        @keyframes softPulse{0%,100%{box-shadow:inset 0 1px 3px rgba(255,255,255,.31),inset 0 -3px 5px rgba(0,0,0,.40),0 0 0 rgba(255,177,112,0)}50%{box-shadow:inset 0 1px 3px rgba(255,255,255,.31),inset 0 -3px 5px rgba(0,0,0,.40),0 0 10px rgba(255,177,112,.17)}}
        .labels{display:flex;flex:1;min-width:0;flex-direction:column;justify-content:center;gap:2px;position:relative;z-index:1}
        .device-name{font-size:clamp(14px,2vw,17px);font-weight:680;line-height:1.08;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#fff}
        .device-status{font-size:11px;font-weight:500;color:${on ? "#ffbd82" : "#c7c4c3"};line-height:1.1}
        .power-mark{position:relative;z-index:1;flex:none;color:${on ? "#ffbd82" : "rgba(245,243,241,.55)"}}
        .power-mark ha-icon{--mdc-icon-size:17px}
        .metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(76px,1fr));gap:5px;margin-top:6px;position:relative;z-index:1}
        .metric{min-width:0;padding:5px 7px 5px;border-radius:10px;background:linear-gradient(160deg,rgba(255,255,255,.075),rgba(255,255,255,.025));
          border:1px solid rgba(255,255,255,.065);box-shadow:inset 0 1px 2px rgba(255,255,255,.055)}
        .metric-head{display:flex;align-items:center;gap:4px;color:#c9c3bd;font-size:9px;font-weight:550;white-space:nowrap}
        .metric-head ha-icon{--mdc-icon-size:12px;color:#ffbd82}
        .metric-value{margin-top:3px;font-size:clamp(13px,2vw,16px);font-weight:680;color:#f8f6f3;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .metric-unit{font-size:9px;font-weight:550;color:#c5bdb5;margin-left:3px}
        .options{margin-top:6px;padding:7px 8px;border-radius:11px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.09);position:relative;z-index:1}
        .options-title{font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#aaa39c;margin:0 0 7px 2px}
        .option-list{display:flex;gap:6px;flex-wrap:wrap}
        .option{display:flex;align-items:center;gap:4px;border-radius:99px;padding:4px 7px;border:1px solid rgba(255,255,255,.12);
          background:rgba(255,255,255,.045);color:#d9d4cf;font-size:10px;cursor:pointer}
        .option.active{border-color:rgba(255,189,130,.35);background:rgba(255,177,112,.10);color:#ffc18c}
        .option ha-icon{--mdc-icon-size:12px}
        @media(max-width:360px){.shell{padding:7px 8px 8px}.device{min-height:50px;gap:7px}.toggle{width:40px;height:40px}.metrics{grid-template-columns:repeat(auto-fit,minmax(70px,1fr))}}
        @media(prefers-reduced-motion:reduce){.device.is-on .toggle{animation:none}.toggle,.gear{transition:none}}
      </style>
      <ha-card><div class="shell">
        <div class="top">
          <div class="heading">${this._esc(group)}</div>
          <div class="top-right">
            <div class="state">${on ? "EIN" : "AUS"}</div>
            ${c.show_settings !== false ? `<button class="gear" type="button" aria-label="Zusatzoptionen" title="Zusatzoptionen"><ha-icon icon="mdi:cog-outline"></ha-icon></button>` : ""}
          </div>
        </div>
        <div class="device ${on ? "is-on" : ""}">
          <button class="toggle" type="button" aria-label="${on ? "Steckdose ausschalten" : "Steckdose einschalten"}" title="${on ? "Ausschalten" : "Einschalten"}">
            <ha-icon icon="mdi:power-plug"></ha-icon>
          </button>
          <div class="labels">
            <div class="device-name">${this._esc(name)}</div>
            <div class="device-status">${on ? "Eingeschaltet" : "Ausgeschaltet"}</div>
          </div>
          <div class="power-mark"><ha-icon icon="mdi:power"></ha-icon></div>
        </div>
        ${shownMetrics.length ? `<div class="metrics">${shownMetrics.map(m => `
          <div class="metric"><div class="metric-head"><ha-icon icon="${m.icon}"></ha-icon><span>${m.label}</span></div>
          <div class="metric-value">${m.data.value}<span class="metric-unit">${this._esc(m.data.unit)}</span></div></div>`).join("")}</div>` : ""}
        ${settingsOpen && c.show_settings !== false ? `<div class="options">
          <div class="options-title">Messwerte einblenden</div>
          <div class="option-list">${metricDefs.filter(m => m.sensor && this._sensor(m.sensor,m.unit)).map(m => `
            <button class="option ${visibility[m.key] ? "active" : ""}" data-metric="${m.key}" type="button">
              <ha-icon icon="${visibility[m.key] ? "mdi:check-circle" : "mdi:circle-outline"}"></ha-icon>${m.label}
            </button>`).join("") || `<span style="font-size:11px;color:#aaa39c">Keine Messwertsensoren konfiguriert.</span>`}
          </div>
        </div>` : ""}
      </div></ha-card>`;

    this.shadowRoot.querySelector(".toggle")?.addEventListener("click", () => {
      if (this._hass) this._hass.callService("switch", on ? "turn_off" : "turn_on", { entity_id: c.entity });
    });
    this.shadowRoot.querySelector(".gear")?.addEventListener("click", () => {
      this._settingsOpen = !this._settingsOpen;
      this._render();
    });
    this.shadowRoot.querySelectorAll("[data-metric]").forEach(button => button.addEventListener("click", () => {
      const key = button.dataset.metric;
      this._metricVisibility = { power:true, energy:true, voltage:true, ...(this._metricVisibility || {}) };
      this._metricVisibility[key] = !this._metricVisibility[key];
      this._render();
    }));
  }

  static getConfigElement() { return document.createElement("steckdosen-glass-card-editor"); }
}

class SteckdosenGlassCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { ...config };
    if (!this._rendered) { this._rendered = true; this._renderEditor(); }
  }
  _renderEditor() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `<style>:host{display:block}ha-form{display:block}</style><ha-form></ha-form>`;
    const form = this.shadowRoot.querySelector("ha-form");
    form.hass = this._hass;
    form.data = { show_power:true, show_energy:true, show_voltage:true, show_settings:true, ...this._config };
    form.schema = [
      { name:"entity", required:true, selector:{entity:{domain:"switch"}} },
      { name:"group_name", selector:{text:{}} },
      { name:"name", selector:{text:{}} },
      { name:"power_sensor", selector:{entity:{domain:"sensor"}} },
      { name:"energy_sensor", selector:{entity:{domain:"sensor"}} },
      { name:"voltage_sensor", selector:{entity:{domain:"sensor"}} },
      { name:"show_power", selector:{boolean:{}} },
      { name:"show_energy", selector:{boolean:{}} },
      { name:"show_voltage", selector:{boolean:{}} },
      { name:"show_settings", selector:{boolean:{}} },
      { name:"card_width", selector:{select:{options:[
        {label:"Automatisch",value:"auto"},{label:"320 px",value:"320"},{label:"400 px",value:"400"},
        {label:"480 px",value:"480"},{label:"560 px",value:"560"}
      ],mode:"dropdown"}}}
    ];
    form.addEventListener("value-changed", event => {
      event.stopPropagation();
      const next = { ...this._config, ...event.detail.value };
      Object.keys(next).forEach(k => { if (next[k] === "" || next[k] === undefined) delete next[k]; });
      this._config = next;
      this.dispatchEvent(new CustomEvent("config-changed",{bubbles:true,composed:true,detail:{config:next}}));
    });
  }
  set hass(hass) {
    this._hass = hass;
    const form = this.shadowRoot?.querySelector("ha-form");
    if (form) form.hass = hass;
  }
}

if (!customElements.get("steckdosen-glass-card")) customElements.define("steckdosen-glass-card", SteckdosenGlassCard);
if (!customElements.get("steckdosen-glass-card-editor")) customElements.define("steckdosen-glass-card-editor", SteckdosenGlassCardEditor);
window.customCards = window.customCards || [];
if (!window.customCards.some(card => card.type === "steckdosen-glass-card")) {
  window.customCards.push({type:"steckdosen-glass-card",name:"Steckdosen Glass Card",description:"Filigrane Glass-Karte zum Schalten von Steckdosen mit optionalen Messwerten."});
}
