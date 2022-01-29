console.info("%c  MIFLORA-CARD  \n%c Version 0.1.4 ", "color: orange; font-weight: bold; background: black", "color: white; font-weight: bold; background: dimgray");
class MifloraCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({
            mode: 'open'
        });

        this.sensors = {
            moisture: 'hass:water',
            temperature: 'hass:thermometer',
            intensity: 'hass:white-balance-sunny',
            rssi: 'mdi:wifi',
            conductivity: 'mdi:sprout',
            battery: 'hass:battery',
            location: 'mdi:home-map-marker'
        };

    }

    _computeIcon(sensor, state) {
        const icon = this.sensors[sensor];
        if (sensor === 'battery') {
            if (state <= 5) {
                return `${icon}-alert`;
            } else if (state < 95) {
                return `${icon}-${Math.round((state / 10) - 0.01) * 10}`;
            }
        }
        return icon;
    }

    _click(entity) {
        this._fire('hass-more-info', {
            entityId: entity
        });
    }

    _fire(type, detail) {
        const event = new Event(type, {
            bubbles: true,
            cancelable: false,
            composed: true
        });
        event.detail = detail || {};
        this.shadowRoot.dispatchEvent(event);
        return event;
    }

    //Home Assistant will set the hass property when the state of Home Assistant changes (frequent).
    set hass(hass) {
        const config = this.config;

        var _maxMoisture = parseFloat(config.max_moisture);
        var _minMoisture = parseFloat(config.min_moisture);
        var _minConductivity = parseFloat(config.min_conductivity);
        var _maxConductivity = parseFloat(config.max_conductivity);        
        var _minTemperature = parseFloat(config.min_temperature);
        var _maxTemperature = parseFloat(config.max_temperature);

        this.shadowRoot.getElementById('container').innerHTML = `
            <div class="content clearfix">
                <div id="sensors"></div>
            </div>
            `;

        for (var i = 0; i < config.entities.length; i++) {
            var _name = config.entities[i]['type'];
            var _sensor = config.entities[i]['entity'];
            if (config.entities[i]['name']) {
                var _display_name = config.entities[i]['name'];
            } else {
                var _display_name = _name[0].toUpperCase() + _name.slice(1);
            }
            var _state = '';
            var _uom = '';
            if (hass.states[_sensor]) {
                _state = parseFloat(hass.states[_sensor].state);
                _uom = hass.states[_sensor].attributes.unit_of_measurement || "";
            } else {
                _state = 'Invalid Sensor';
            }

            var _icon = this._computeIcon(_name, _state);
            var _alertStyle = '';
            var _alertIcon = '';
            if (_name == 'moisture') {
                if (_state > _maxMoisture) {
                    _alertStyle = ';color:#5daeea';
                    _alertIcon = '&#9650; ';
                } else if (_state < _minMoisture) {
                    _alertStyle = ';color:#5daeea';
                    _alertIcon = '&#9660; '
                }
            }
            if (_name == 'conductivity') {
                if (_state < _minConductivity) {
                    _alertStyle = ';color:#e15b64';
                    _alertIcon = '&#9660; ';
                } else if (_state > _maxConductivity) {
                    _alertStyle = ';color:#e15b64';
                    _alertIcon = '&#9650; '
                }
            }
            if (_name == 'temperature') {
                if (_state < _minTemperature) {
                    _alertStyle = ';color:#e15b64';
                    _alertIcon = '&#9660; ';
                } else if (_state > _maxTemperature) {
                    _alertStyle = ';color:#e15b64';
                    _alertIcon = '&#9650; '
                }
            }
            this.shadowRoot.getElementById('sensors').innerHTML += `
                <div id="sensor${i}" class="sensor">
                    <div class="icon"><ha-icon icon="${_icon}"></ha-icon></div>
                    <div class="name">${_display_name[0].toUpperCase()}${_display_name.slice(1)}</div>
                    <div class="state" style="${_alertStyle}">${_alertIcon}${_state}${_uom}</div>
                </div>
                `
        }
         if (config.location != null) {
            var _plantlocation = config.location;
            this.shadowRoot.getElementById('sensors').innerHTML += `
                <div id="sensor${config.entities.length+1}" class="sensor">
                    <div class="icon"><ha-icon icon="mdi:home-map-marker"></ha-icon></div>
                    <div class="name">Location</div>
                    <div class="state" style="">${_plantlocation}</div>
                </div>
                `
        }
        

        for (var i = 0; i < config.entities.length; i++) {
            this.shadowRoot.getElementById('sensor' + [i]).onclick = this._click.bind(this, config.entities[i]['entity']);
        }
    }

    //  Home Assistant will call setConfig(config) when the configuration changes (rare).
    setConfig(config) {
        if (!config.entities) {
            throw new Error('Please define an entity');
        }

        const root = this.shadowRoot;
        if (root.lastChild) root.removeChild(root.lastChild);

        this.config = config;

        const card = document.createElement('ha-card');
        const content = document.createElement('div');
        const plantimage = document.createElement('div');
        const style = document.createElement('style');

        style.textContent = `
            .card-header {
                padding: 0px !important;
                margin: 0px !important;
            }

            ha-card {
                position: relative;
                padding: 12px;
                background-size: 100%;
            }
            ha-card .header {
                width: 100%;
            }
            .image {
                margin-left: 5px;
                margin-right: 5px;
                margin-bottom: 5px;
                margin-top: -8px;
                width: 150px;
                height: 150px;
                border-radius: 6px;
            }
            .location {
                float: right;
                margin-left: 5px;
                display: grid;
                text-align: center;
            }            
            .sensor {
                display: flex;
                cursor: pointer;
                padding-bottom: 9px;
            }
            .icon {
                margin-left: 0px;
                color: var(--paper-item-icon-color);
            }
            .name {
                margin-top: 3px;
                margin-left: 10px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .state {
                white-space: nowrap;
                overflow: hidden;
                margin-top: 3px;
                margin-left: auto
            }
            .uom {
                color: var(--secondary-text-color);
            }
            .clearfix::after {
                content: "";
                clear: both;
                display: table;
            }
            `;

            // Display Plant image (required) and location
            plantimage.innerHTML = `
            <p class="location"><img class="image" src=/local/${config.image}></p>
            `;

        content.id = "container";
        card.header = config.title;
        card.appendChild(plantimage);
        card.appendChild(content);
        card.appendChild(style);
        root.appendChild(card);
    }

    // The height of your card. Home Assistant uses this to automatically
    // distribute all cards over the available columns.
    getCardSize() {
        return 2;
    }
}

customElements.define('miflora-card', MifloraCard);
