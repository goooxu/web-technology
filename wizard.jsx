class WelcomePage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.languages = ['Afrikaans', 'Albanian', 'Amharic', 'Arabic (Egyptian Spoken)', 'Arabic (Levantine)', 'Arabic (Modern Standard)', 'Arabic (Moroccan Spoken)', 'Arabic (Overview)', 'Aramaic', 'Armenian', 'Assamese', 'Aymara', 'Azerbaijani', 'Balochi', 'Bamanankan', 'Bashkort (Bashkir)', 'Basque', 'Belarusan', 'Bengali', 'Bhojpuri', 'Bislama', 'Bosnian', 'Brahui', 'Bulgarian', 'Burmese', 'Cantonese', 'Catalan', 'Cebuano', 'Chechen', 'Cherokee', 'Croatian', 'Czech', 'Dakota', 'Danish', 'Dari', 'Dholuo', 'Dutch', 'English', 'Esperanto', 'Estonian', 'Éwé', 'Finnish', 'French', 'Georgian', 'German', 'Gikuyu', 'Greek', 'Guarani', 'Gujarati', 'Haitian Creole', 'Hausa', 'Hawaiian', 'Hawaiian Creole', 'Hebrew', 'Hiligaynon', 'Hindi', 'Hungarian', 'Icelandic', 'Igbo', 'Ilocano', 'Indonesian (Bahasa Indonesia)', 'Inuit/Inupiaq', 'Irish Gaelic', 'Italian', 'Japanese', 'Jarai', 'Javanese', 'K’iche’', 'Kabyle', 'Kannada', 'Kashmiri', 'Kazakh', 'Khmer', 'Khoekhoe', 'Korean', 'Kurdish', 'Kyrgyz', 'Lao', 'Latin', 'Latvian', 'Lingala', 'Lithuanian', 'Macedonian', 'Maithili', 'Malagasy', 'Malay (Bahasa Melayu)', 'Malayalam', 'Mandarin (Chinese)', 'Marathi', 'Mende', 'Mongolian', 'Nahuatl', 'Navajo', 'Nepali', 'Norwegian', 'Ojibwa', 'Oriya', 'Oromo', 'Pashto', 'Persian', 'Polish', 'Portuguese', 'Punjabi', 'Quechua', 'Romani', 'Romanian', 'Russian', 'Rwanda', 'Samoan', 'Sanskrit', 'Serbian', 'Shona', 'Sindhi', 'Sinhala', 'Slovak', 'Slovene', 'Somali', 'Spanish', 'Swahili', 'Swedish', 'Tachelhit', 'Tagalog', 'Tajiki', 'Tamil', 'Tatar', 'Telugu', 'Thai', 'Tibetic languages', 'Tigrigna', 'Tok Pisin', 'Turkish', 'Turkmen', 'Ukrainian', 'Urdu', 'Uyghur', 'Uzbek', 'Vietnamese', 'Warlpiri', 'Welsh', 'Wolof', 'Xhosa', 'Yakut', 'Yiddish', 'Yoruba', 'Yucatec', 'Zapotec', 'Zulu'];
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(e) {
        this.props.onSubmit(e.target.id);
    }

    render() {
        return (
            <React.Fragment>
                <i className="material-icons center">android</i>
                <h3 className="center">Bienvenue!</h3>
                <dl className="center fill">
                    {this.languages.map(language => <dt key={language}>{language}</dt>)}
                </dl>
                <button className="center" id="commencer" onClick={this.handleClick}>COMMENCER</button>
            </React.Fragment>
        );
    }
}

class UserTermPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = { checked: false };
        this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
        this.handleClick = this.handleClick.bind(this);
    }

    handleCheckboxChange(e) {
        this.setState({
            checked: e.target.checked
        });
    }

    handleClick(e) {
        this.props.onSubmit(e.target.id);
    }

    render() {
        return (
            <React.Fragment>
                <i className="material-icons center">comment</i>
                <h3 className="center">Terms of use</h3>
                <div className="fill">
                    <h4>End User License Agreement</h4>
                    <p>Please read the End User License Agreement carefully before using your Huawei device. Using any Huawei device indicates you acknowledge and agree to the terms and conditions of this Agreement. If you recently purchased a Huawei product and do not agree to the terms and conditions of this Agreement, you may return your Huawei device to an offical Huawei retailer or authorized reseller for a refund, provided that you abide by the terms of Huawei's returns policy.</p>
                    <a href="#">DETAILS</a>
                    <h4>Basic service statement</h4>
                    <p>EMUI provides you with a number of basic services that help ensure that your device works as it should. These services may need to connect to the Internet, and may require the storage and Phone permissions. Touch Details to learn more.</p>
                    <a href="#">DETAILS</a>
                    <p />
                    <div>
                        <label><input type="checkbox" checked={this.state.checked} onChange={this.handleCheckboxChange}></input>I have carefully read and agree to the above terms</label>
                    </div>
                </div>
                <div className="toolbar">
                    <button id="back" onClick={this.handleClick}>&lt; BACK</button>
                    <button id="next" onClick={this.handleClick} disabled={!this.state.checked}>NEXT &gt;</button>
                </div>
            </React.Fragment>
        );
    }
}

class DataImportPage extends React.Component {
    constructor(props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(e) {
        this.props.onSubmit(e.target.id);
    }

    render() {
        return (
            <React.Fragment>
                <i className="material-icons center">file_copy</i>
                <h3 className="center">Data Import</h3>
                <p>You can import your data to this device from any of the following:</p>
                <dl className="center fill">
                    <dt className="toolbar">
                        <i className="material-icons center">android</i>
                        <span className="center">Android device</span>
                    </dt>
                    <dt className="toolbar">
                        <i className="material-icons center">cast</i>
                        <span className="center">iPhone or iPad</span>
                    </dt>
                    <dt className="toolbar">
                        <i className="material-icons center">backup</i>
                        <span className="center">Google cloud backup</span>
                    </dt>
                </dl>
                <div className="toolbar">
                    <button id="back" onClick={this.handleClick}>&lt; BACK</button>
                    <button id="next" onClick={this.handleClick}>NEXT &gt;</button>
                </div>
            </React.Fragment>
        );
    }
}

class ConnectToNetworkPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = { opened: false, connected: false };
        if (props.argument) {
            if (props.argument.opened) {
                this.state.opened = true;
            }
            if (props.argument.connected) {
                this.state.connected = true;
            }
        }
        this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
        this.handleNetworkClick = this.handleNetworkClick.bind(this);
        this.handleButtonClick = this.handleButtonClick.bind(this);
    }

    handleCheckboxChange(e) {
        this.setState({
            opened: e.target.checked
        });
    }

    handleNetworkClick(e) {
        this.props.onSubmit('select');
    }

    handleButtonClick(e) {
        this.props.onSubmit(e.target.id);
    }

    render() {
        return (
            <React.Fragment>
                <i className="material-icons center">wifi</i>
                <h3 className="center">Connect to a network</h3>
                <div className="toolbar">
                    <span className="center">Wi-Fi</span>
                    <label className="switch center">
                        <input type="checkbox" checked={this.state.opened} onChange={this.handleCheckboxChange} />
                        <span className="slider round"></span>
                    </label>
                </div>
                <hr></hr>
                <div className="fill">
                    <h4>AVAILABLE NETWORKS</h4>
                    <div onClick={this.handleNetworkClick} className={this.state.opened ? 'toolbar' : 'toolbar hidden'}>
                        <div className="htoolbar">
                            <span className={this.state.connected ? 'thick' : ''}>My Network</span>
                            <span>{this.state.connected ? 'Connected' : 'Encrypted (WPS available)'}</span>
                        </div>
                        <i className="material-icons">wifi</i>
                    </div>
                    <p />
                    <a href="#">Add network</a>
                </div>
                <div className="toolbar">
                    <button id="back" onClick={this.handleButtonClick}>&lt; BACK</button>
                    <button id="skip" onClick={this.handleButtonClick} className={this.state.connected ? 'hidden' : ''}>SKIP</button>
                    <button id="next" onClick={this.handleButtonClick} className={!this.state.connected ? 'hidden' : ''}>NEXT</button>
                </div>
            </React.Fragment>
        );
    }
}

class NetworkPasswordPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = { password: '' };
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleClick = this.handleClick.bind(this);
    }

    handleInputChange(e) {
        this.setState({
            password: e.target.value
        });
    }

    handleClick(e) {
        this.props.onSubmit(e.target.id);
    }

    render() {
        return (
            <React.Fragment>
                <div className="toolbar-left">
                    <i className="material-icons center">arrow_back</i>
                    <span className="center">My Network</span>
                </div>
                <input type="password" value={this.state.password} onChange={this.handleInputChange}></input>
                <label><input type="checkbox"></input>Show advanced options</label>
                <div className="fill" />
                <div className="toolbar">
                    <button id="cancel" onClick={this.handleClick}>CANCEL</button>
                    <button id="connect" onClick={this.handleClick} disabled={!this.state.password}>CONNECT</button>
                </div>
            </React.Fragment>
        );
    }
}

class GoogleServiecsPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(e) {
        this.props.onSubmit(e.target.id);
    }

    render() {
        return (
            <React.Fragment>
                <i className="material-icons center">settings</i>
                <h3 className="center">Google Services</h3>
                <p>Tap to learn more about each service, such as how to turn it on or off later. Data will be used according to Google's Privacy Policy.</p>
                <div className="fill">
                    <h4>Backup &amp; storage</h4>
                    <div className="toolbar">
                        <i className="material-icons">backup</i>
                        <div className="fill">
                            <h5>Back up to Google Drive</h5>
                            <span>Easily restore your data or switch phones at any time. Your backup includes apps, app data, call history, contacts, device settings (including Wi-Fi passwords and permissions), and SMS.</span>
                            <span>Your backups are uploaded to Google and encrypted using your Google Account password. For some data, your device's screen lock PIN, pattern, or password is also used for encryption.</span>
                        </div>
                        <label className="switch">
                            <input type="checkbox" />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    <h4>Location</h4>
                    <div className="toolbar">
                        <i className="material-icons">location_on</i>
                        <div className="fill">
                            <h5>Use location</h5>
                            <span>Allow apps and services with location permission to use your devuce's location. Google may collect location data periodically and use this data in an anonymous way to improve location accuracy and location-based services.</span>
                        </div>
                        <label className="switch">
                            <input type="checkbox" />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    <div className="toolbar">
                        <i className="material-icons">location_on</i>
                        <div className="fill">
                            <h5>Allow scanning</h5>
                            <span>Allow apps and services to scan for Wi-Fi networks and nearby devices at any time, even when Wi-Fi or Bluetooth is off.</span>
                        </div>
                        <label className="switch">
                            <input type="checkbox" />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    <h4>Device maintenance</h4>
                    <div className="toolbar">
                        <i className="material-icons">data_usage</i>
                        <div className="fill">
                            <h5>Send usage and diagnostic data</h5>
                            <span>Help improve your Android experience by automatically sending diagnostic, device, and app usage data to Google. This will help battery life, system and app stability, and other improvements. Some aggregate data will also help Google apps and partners, such as Android developers. If your additional Web &amp; App Activity setting is turned on, this data may be saved to your Google Account.</span>
                        </div>
                        <label className="switch">
                            <input type="checkbox" />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    <div className="toolbar">
                        <i className="material-icons">system_update</i>
                        <div className="fill">
                            <h5>Install updates &amp; apps</h5>
                            <span>By continuing, you agree that this device may also automatically download and install updates and apps from Google, your carrier, and your device's manufacturer, possibly using cellular data. Some of these apps may offer in-app purchases.</span>
                        </div>
                    </div>
                </div>
                <p>Tap "Accept" to confirm your selection of these Google services settings.</p>
                <div className="toolbar-right">
                    <button id="accept" onClick={this.handleClick}>Accept</button>
                </div>
            </React.Fragment>
        );
    }
}

class CompletePage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        return (
            <React.Fragment>
                <i className="material-icons center">toys</i>
                <h3 className="center">You're all set</h3>
                <p> You can view or delete voice activity in your Google activity controls. You can also turn off Voice Match in Assistant settings.</p>
            </React.Fragment>
        );
    }
}

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = { pageName: 'welcome', pageArgument: {} };
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(action) {
        this.setState(state => {
            console.log(state.pageName, action);
            if (state.pageName === 'welcome' && action === 'commencer') {
                return { pageName: 'userTerm' };
            } else if (state.pageName === 'userTerm' && action === 'back') {
                return { pageName: 'welcome' };
            } else if (state.pageName === 'userTerm' && action === 'next') {
                return { pageName: 'dataImport' };
            } else if (state.pageName === 'dataImport' && action === 'back') {
                return { pageName: 'userTerm' };
            } else if (state.pageName === 'dataImport' && action === 'next') {
                return { pageName: 'connectToNetwork' };
            } else if (state.pageName === 'connectToNetwork' && action === 'back') {
                return { pageName: 'dataImport' };
            } else if (state.pageName === 'connectToNetwork' && action === 'select') {
                return { pageName: 'networkPassword' };
            } else if (state.pageName === 'connectToNetwork' && action === 'skip') {
                return { pageName: 'googleServices' };
            } else if (state.pageName === 'connectToNetwork' && action === 'next') {
                return { pageName: 'googleServices' };
            } else if (state.pageName === 'networkPassword' && action === 'cancel') {
                return { pageName: 'connectToNetwork', pageArgument: { opened: true } };
            } else if (state.pageName === 'networkPassword' && action === 'connect') {
                return { pageName: 'connectToNetwork', pageArgument: { opened: true, connected: true } };
            } else if (state.pageName === 'googleServices' && action === 'accept') {
                return { pageName: 'complete' };
            }
        });
    }

    renderPage(pageName, pageArgument) {
        switch (pageName) {
            case 'welcome': return <WelcomePage onSubmit={this.handleSubmit} argument={pageArgument} />;
            case 'userTerm': return <UserTermPage onSubmit={this.handleSubmit} argument={pageArgument} />;
            case 'dataImport': return <DataImportPage onSubmit={this.handleSubmit} argument={pageArgument} />;
            case 'connectToNetwork': return <ConnectToNetworkPage onSubmit={this.handleSubmit} argument={pageArgument} />;
            case 'networkPassword': return <NetworkPasswordPage onSubmit={this.handleSubmit} argument={pageArgument} />;
            case 'googleServices': return <GoogleServiecsPage onSubmit={this.handleSubmit} argument={pageArgument} />;
            case 'complete': return <CompletePage onSubmit={this.handleSubmit} argument={pageArgument} />;
        }
    }

    render() {
        return (
            <div className="page">
                {this.renderPage(this.state.pageName, this.state.pageArgument)}
            </div>
        );
    }
}

ReactDOM.render(<App />, document.querySelector('#root'));