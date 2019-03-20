class WelcomePage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.languages = ['Afrikaans', 'Albanian', 'Amharic', 'Arabic (Egyptian Spoken)', 'Arabic (Levantine)', 'Arabic (Modern Standard)', 'Arabic (Moroccan Spoken)', 'Arabic (Overview)', 'Aramaic', 'Armenian', 'Assamese', 'Aymara', 'Azerbaijani', 'Balochi', 'Bamanankan', 'Bashkort (Bashkir)', 'Basque', 'Belarusan', 'Bengali', 'Bhojpuri', 'Bislama', 'Bosnian', 'Brahui', 'Bulgarian', 'Burmese', 'Cantonese', 'Catalan', 'Cebuano', 'Chechen', 'Cherokee', 'Croatian', 'Czech', 'Dakota', 'Danish', 'Dari', 'Dholuo', 'Dutch', 'English', 'Esperanto', 'Estonian', 'Éwé', 'Finnish', 'French', 'Georgian', 'German', 'Gikuyu', 'Greek', 'Guarani', 'Gujarati', 'Haitian Creole', 'Hausa', 'Hawaiian', 'Hawaiian Creole', 'Hebrew', 'Hiligaynon', 'Hindi', 'Hungarian', 'Icelandic', 'Igbo', 'Ilocano', 'Indonesian (Bahasa Indonesia)', 'Inuit/Inupiaq', 'Irish Gaelic', 'Italian', 'Japanese', 'Jarai', 'Javanese', 'K’iche’', 'Kabyle', 'Kannada', 'Kashmiri', 'Kazakh', 'Khmer', 'Khoekhoe', 'Korean', 'Kurdish', 'Kyrgyz', 'Lao', 'Latin', 'Latvian', 'Lingala', 'Lithuanian', 'Macedonian', 'Maithili', 'Malagasy', 'Malay (Bahasa Melayu)', 'Malayalam', 'Mandarin (Chinese)', 'Marathi', 'Mende', 'Mongolian', 'Nahuatl', 'Navajo', 'Nepali', 'Norwegian', 'Ojibwa', 'Oriya', 'Oromo', 'Pashto', 'Persian', 'Polish', 'Portuguese', 'Punjabi', 'Quechua', 'Romani', 'Romanian', 'Russian', 'Rwanda', 'Samoan', 'Sanskrit', 'Serbian', 'Shona', 'Sindhi', 'Sinhala', 'Slovak', 'Slovene', 'Somali', 'Spanish', 'Swahili', 'Swedish', 'Tachelhit', 'Tagalog', 'Tajiki', 'Tamil', 'Tatar', 'Telugu', 'Thai', 'Tibetic languages', 'Tigrigna', 'Tok Pisin', 'Turkish', 'Turkmen', 'Ukrainian', 'Urdu', 'Uyghur', 'Uzbek', 'Vietnamese', 'Warlpiri', 'Welsh', 'Wolof', 'Xhosa', 'Yakut', 'Yiddish', 'Yoruba', 'Yucatec', 'Zapotec', 'Zulu'];
    }

    render() {
        return (
            <div className="page">
                <i className="material-icons center">android</i>
                <h4 className="center">Bienvenue!</h4>
                <dl className="center fill">
                    {this.languages.map(language => <dt key={language}>{language}</dt>)}
                </dl>
                <div className="center">
                    <input type="submit" id="commencer" value="COMMENCER"></input>
                </div>
            </div>
        );
    }
}

class UserTermPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = { checked: false };
        this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
    }

    handleCheckboxChange(e) {
        this.setState({
            checked: e.target.checked
        });
    }

    render() {
        return (
            <div className="page">
                <i className="material-icons center">comment</i>
                <h4 className="center">Terms of use</h4>
                <div className="fill">
                    <h5>End User License Agreement</h5>
                    <p>Please read the End User License Agreement carefully before using your Huawei device. Using any Huawei device indicates you acknowledge and agree to the terms and conditions of this Agreement. If you recently purchased a Huawei product and do not agree to the terms and conditions of this Agreement, you may return your Huawei device to an offical Huawei retailer or authorized reseller for a refund, provided that you abide by the terms of Huawei's returns policy.</p>
                    <a href="#">DETAILS</a>
                    <h5>Basic service statement</h5>
                    <p>EMUI provides you with a number of basic services that help ensure that your device works as it should. These services may need to connect to the Internet, and may require the storage and Phone permissions. Touch Details to learn more.</p>
                    <a href="#">DETAILS</a>
                    <div>
                        <label><input type="checkbox" checked={this.state.checked} onChange={this.handleCheckboxChange}></input>I have carefully read and agree to the above terms</label>
                    </div>
                </div>
                <div className="toolbar">
                    <input type="submit" id="usertermback" value="< BACK"></input>
                    <input type="submit" id="usertermnext" value="NEXT >" disabled={!this.state.checked}></input>
                </div>
            </div >
        );
    }
}

class DataImportPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        return (
            <div className="page">
                <i className="material-icons center">file_copy</i>
                <h4 className="center">Data Import</h4>
                <p>You can import your data to this device from any of the following:</p>
                <dl className="center fill">
                    <dt><i className="material-icons">android</i>Android device</dt>
                    <dt><i className="material-icons">cast</i>iPhone or iPad</dt>
                    <dt><i className="material-icons">backup</i>Google cloud backup</dt>
                </dl>
                <div className="toolbar">
                    <input type="submit" id="dataimportback" value="< BACK"></input>
                    <input type="submit" id="dataimportnext" value="NEXT >"></input>
                </div>
            </div>
        );
    }
}

class ConnectToNetworkPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = { checked: false };
        this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
    }

    handleCheckboxChange(e) {
        this.setState({
            checked: e.target.checked
        });
    }

    render() {
        return (
            <div className="page">
                <i className="material-icons center">wifi</i>
                <h4 className="center">Connect to a network</h4>
                <div className="toolbar">
                    <span>Wi-Fi</span>
                    <label className="switch">
                        <input type="checkbox" checked={this.state.checked} onChange={this.handleCheckboxChange} />
                        <span className="slider round"></span>
                    </label>
                </div>
                <hr></hr>
                <div className="fill">
                    <h5>AVAILABLE NETWORKS</h5>
                    <div className={this.state.checked ? 'toolbar' : 'toolbar hidden'}>
                        <span>My Network</span>
                        <i className="material-icons">wifi</i>
                    </div>
                    <a href="#">Add network</a>
                </div>
                <div className="toolbar">
                    <input type="submit" id="connecttonetworkback" value="< BACK"></input>
                    <input type="submit" id="connecttonetworkskip" value="SKIP"></input>
                </div>
            </div>
        );
    }
}

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = { pageIndex: 0 };
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(e) {
        e.preventDefault();
        const id = document.activeElement.id;
        this.setState(state => {
            if (state.pageIndex === 0 && id === 'commencer') {
                return { pageIndex: 1 };
            } else if (state.pageIndex === 1 && id === 'usertermback') {
                return { pageIndex: 0 };
            } else if (state.pageIndex === 1 && id === 'usertermnext') {
                return { pageIndex: 2 };
            } else if (state.pageIndex === 2 && id === 'dataimportback') {
                return { pageIndex: 1 };
            } else if (state.pageIndex === 2 && id === 'dataimportnext') {
                return { pageIndex: 3 };
            } else if (state.pageIndex === 3 && id === 'connecttonetworkback') {
                return { pageIndex: 2 };
            }
        });
    }

    renderPage(index) {
        switch (index) {
            case 0: return <WelcomePage />;
            case 1: return <UserTermPage />;
            case 2: return <DataImportPage />;
            case 3: return <ConnectToNetworkPage />;
        }
    }

    render() {
        return (
            <form onSubmit={this.handleSubmit}>
                {this.renderPage(this.state.pageIndex)}
            </form >
        );
    }
}

ReactDOM.render(<App />, document.querySelector('#root'));