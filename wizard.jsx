const {
    Avatar,
    Button,
    Icon,
    List,
    ListItem,
    ListItemText,
    Typography,
    withStyles
} = window['material-ui'];


function CreateFirstPage(props) {
    const { classes } = props;
    return (
        <div className={classes.main}>
            <Avatar className={classes.avatar}>
                <Icon className={classes.icon} >android</Icon>
            </Avatar>
            <Typography component="h1" variant="h4" align="center">Bienvenue!</Typography>
            <List className={classes.list}>
                <ListItem button><ListItemText primary="Afrikaans" /></ListItem>
                <ListItem button><ListItemText primary="Albanian" /></ListItem>
                <ListItem button><ListItemText primary="Amharic" /></ListItem>
                <ListItem button><ListItemText primary="Arabic (Egyptian Spoken)" /></ListItem>
                <ListItem button><ListItemText primary="Arabic (Levantine)" /></ListItem>
                <ListItem button><ListItemText primary="Arabic (Modern Standard)" /></ListItem>
                <ListItem button><ListItemText primary="Arabic (Moroccan Spoken)" /></ListItem>
                <ListItem button><ListItemText primary="Arabic (Overview)" /></ListItem>
                <ListItem button><ListItemText primary="Aramaic" /></ListItem>
                <ListItem button><ListItemText primary="Armenian" /></ListItem>
                <ListItem button><ListItemText primary="Assamese" /></ListItem>
                <ListItem button><ListItemText primary="Aymara" /></ListItem>
                <ListItem button><ListItemText primary="Azerbaijani" /></ListItem>
                <ListItem button><ListItemText primary="Balochi" /></ListItem>
                <ListItem button><ListItemText primary="Bamanankan" /></ListItem>
                <ListItem button><ListItemText primary="Bashkort (Bashkir)" /></ListItem>
                <ListItem button><ListItemText primary="Basque" /></ListItem>
                <ListItem button><ListItemText primary="Belarusan" /></ListItem>
                <ListItem button><ListItemText primary="Bengali" /></ListItem>
                <ListItem button><ListItemText primary="Bhojpuri" /></ListItem>
                <ListItem button><ListItemText primary="Bislama" /></ListItem>
                <ListItem button><ListItemText primary="Bosnian" /></ListItem>
                <ListItem button><ListItemText primary="Brahui" /></ListItem>
                <ListItem button><ListItemText primary="Bulgarian" /></ListItem>
                <ListItem button><ListItemText primary="Burmese" /></ListItem>
                <ListItem button><ListItemText primary="Cantonese" /></ListItem>
                <ListItem button><ListItemText primary="Catalan" /></ListItem>
                <ListItem button><ListItemText primary="Cebuano" /></ListItem>
                <ListItem button><ListItemText primary="Chechen" /></ListItem>
                <ListItem button><ListItemText primary="Cherokee" /></ListItem>
                <ListItem button><ListItemText primary="Croatian" /></ListItem>
                <ListItem button><ListItemText primary="Czech" /></ListItem>
                <ListItem button><ListItemText primary="Dakota" /></ListItem>
                <ListItem button><ListItemText primary="Danish" /></ListItem>
                <ListItem button><ListItemText primary="Dari" /></ListItem>
                <ListItem button><ListItemText primary="Dholuo" /></ListItem>
                <ListItem button><ListItemText primary="Dutch" /></ListItem>
                <ListItem button><ListItemText primary="English" /></ListItem>
                <ListItem button><ListItemText primary="Esperanto" /></ListItem>
                <ListItem button><ListItemText primary="Estonian" /></ListItem>
                <ListItem button><ListItemText primary="Finnish" /></ListItem>
                <ListItem button><ListItemText primary="French" /></ListItem>
                <ListItem button><ListItemText primary="Georgian" /></ListItem>
                <ListItem button><ListItemText primary="German" /></ListItem>
                <ListItem button><ListItemText primary="Gikuyu" /></ListItem>
                <ListItem button><ListItemText primary="Greek" /></ListItem>
                <ListItem button><ListItemText primary="Guarani" /></ListItem>
                <ListItem button><ListItemText primary="Gujarati" /></ListItem>
                <ListItem button><ListItemText primary="Haitian Creole" /></ListItem>
                <ListItem button><ListItemText primary="Hausa" /></ListItem>
                <ListItem button><ListItemText primary="Hawaiian" /></ListItem>
                <ListItem button><ListItemText primary="Hawaiian Creole" /></ListItem>
                <ListItem button><ListItemText primary="Hebrew" /></ListItem>
                <ListItem button><ListItemText primary="Hiligaynon" /></ListItem>
                <ListItem button><ListItemText primary="Hindi" /></ListItem>
                <ListItem button><ListItemText primary="Hungarian" /></ListItem>
                <ListItem button><ListItemText primary="Icelandic" /></ListItem>
                <ListItem button><ListItemText primary="Igbo" /></ListItem>
                <ListItem button><ListItemText primary="Ilocano" /></ListItem>
                <ListItem button><ListItemText primary="Indonesian (Bahasa Indonesia)" /></ListItem>
                <ListItem button><ListItemText primary="Inuit/Inupiaq" /></ListItem>
                <ListItem button><ListItemText primary="Irish Gaelic" /></ListItem>
                <ListItem button><ListItemText primary="Italian" /></ListItem>
                <ListItem button><ListItemText primary="Japanese" /></ListItem>
                <ListItem button><ListItemText primary="Jarai" /></ListItem>
                <ListItem button><ListItemText primary="Javanese" /></ListItem>
                <ListItem button><ListItemText primary="Kabyle" /></ListItem>
                <ListItem button><ListItemText primary="Kannada" /></ListItem>
                <ListItem button><ListItemText primary="Kashmiri" /></ListItem>
                <ListItem button><ListItemText primary="Kazakh" /></ListItem>
                <ListItem button><ListItemText primary="Khmer" /></ListItem>
                <ListItem button><ListItemText primary="Khoekhoe" /></ListItem>
                <ListItem button><ListItemText primary="Korean" /></ListItem>
                <ListItem button><ListItemText primary="Kurdish" /></ListItem>
                <ListItem button><ListItemText primary="Kyrgyz" /></ListItem>
                <ListItem button><ListItemText primary="Lao" /></ListItem>
                <ListItem button><ListItemText primary="Latin" /></ListItem>
                <ListItem button><ListItemText primary="Latvian" /></ListItem>
                <ListItem button><ListItemText primary="Lingala" /></ListItem>
                <ListItem button><ListItemText primary="Lithuanian" /></ListItem>
                <ListItem button><ListItemText primary="Macedonian" /></ListItem>
                <ListItem button><ListItemText primary="Maithili" /></ListItem>
                <ListItem button><ListItemText primary="Malagasy" /></ListItem>
                <ListItem button><ListItemText primary="Malay (Bahasa Melayu)" /></ListItem>
                <ListItem button><ListItemText primary="Malayalam" /></ListItem>
                <ListItem button><ListItemText primary="Mandarin (Chinese)" /></ListItem>
                <ListItem button><ListItemText primary="Marathi" /></ListItem>
                <ListItem button><ListItemText primary="Mende" /></ListItem>
                <ListItem button><ListItemText primary="Mongolian" /></ListItem>
                <ListItem button><ListItemText primary="Nahuatl" /></ListItem>
                <ListItem button><ListItemText primary="Navajo" /></ListItem>
                <ListItem button><ListItemText primary="Nepali" /></ListItem>
                <ListItem button><ListItemText primary="Norwegian" /></ListItem>
                <ListItem button><ListItemText primary="Ojibwa" /></ListItem>
                <ListItem button><ListItemText primary="Oriya" /></ListItem>
                <ListItem button><ListItemText primary="Oromo" /></ListItem>
                <ListItem button><ListItemText primary="Pashto" /></ListItem>
                <ListItem button><ListItemText primary="Persian" /></ListItem>
                <ListItem button><ListItemText primary="Polish" /></ListItem>
                <ListItem button><ListItemText primary="Portuguese" /></ListItem>
                <ListItem button><ListItemText primary="Punjabi" /></ListItem>
                <ListItem button><ListItemText primary="Quechua" /></ListItem>
                <ListItem button><ListItemText primary="Romani" /></ListItem>
                <ListItem button><ListItemText primary="Romanian" /></ListItem>
                <ListItem button><ListItemText primary="Russian" /></ListItem>
                <ListItem button><ListItemText primary="Rwanda" /></ListItem>
                <ListItem button><ListItemText primary="Samoan" /></ListItem>
                <ListItem button><ListItemText primary="Sanskrit" /></ListItem>
                <ListItem button><ListItemText primary="Serbian" /></ListItem>
                <ListItem button><ListItemText primary="Shona" /></ListItem>
                <ListItem button><ListItemText primary="Sindhi" /></ListItem>
                <ListItem button><ListItemText primary="Sinhala" /></ListItem>
                <ListItem button><ListItemText primary="Slovak" /></ListItem>
                <ListItem button><ListItemText primary="Slovene" /></ListItem>
                <ListItem button><ListItemText primary="Somali" /></ListItem>
                <ListItem button><ListItemText primary="Spanish" /></ListItem>
                <ListItem button><ListItemText primary="Swahili" /></ListItem>
                <ListItem button><ListItemText primary="Swedish" /></ListItem>
                <ListItem button><ListItemText primary="Tachelhit" /></ListItem>
                <ListItem button><ListItemText primary="Tagalog" /></ListItem>
                <ListItem button><ListItemText primary="Tajiki" /></ListItem>
                <ListItem button><ListItemText primary="Tamil" /></ListItem>
                <ListItem button><ListItemText primary="Tatar" /></ListItem>
                <ListItem button><ListItemText primary="Telugu" /></ListItem>
                <ListItem button><ListItemText primary="Thai" /></ListItem>
                <ListItem button><ListItemText primary="Tibetic languages" /></ListItem>
                <ListItem button><ListItemText primary="Tigrigna" /></ListItem>
                <ListItem button><ListItemText primary="Tok Pisin" /></ListItem>
                <ListItem button><ListItemText primary="Turkish" /></ListItem>
                <ListItem button><ListItemText primary="Turkmen" /></ListItem>
                <ListItem button><ListItemText primary="Ukrainian" /></ListItem>
                <ListItem button><ListItemText primary="Urdu" /></ListItem>
                <ListItem button><ListItemText primary="Uyghur" /></ListItem>
                <ListItem button><ListItemText primary="Uzbek" /></ListItem>
                <ListItem button><ListItemText primary="Vietnamese" /></ListItem>
                <ListItem button><ListItemText primary="Warlpiri" /></ListItem>
                <ListItem button><ListItemText primary="Welsh" /></ListItem>
                <ListItem button><ListItemText primary="Wolof" /></ListItem>
                <ListItem button><ListItemText primary="Xhosa" /></ListItem>
                <ListItem button><ListItemText primary="Yakut" /></ListItem>
                <ListItem button><ListItemText primary="Yiddish" /></ListItem>
                <ListItem button><ListItemText primary="Yoruba" /></ListItem>
                <ListItem button><ListItemText primary="Yucatec" /></ListItem>
                <ListItem button><ListItemText primary="Zapotec" /></ListItem>
                <ListItem button><ListItemText primary="Zulu" /></ListItem>
            </List>
            <div className={classes.buttons}>
                <Button variant="contained" color="primary" className={classes.button}>COMMENCER</Button>
            </div>
        </div>
    );
}
const FirstPage = withStyles({
    main: {
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        maxHeight: '90vh'
    },
    list: {
        overflow: 'auto',
        margin: '2vh auto'
    },
    buttons: {
        margin: '2vh auto'
    }
})(CreateFirstPage);


function CreateApp(props) {
    const { classes } = props;
    return (
        <div className={classes.main}>
            <FirstPage />
        </div>
    );
}
const App = withStyles({
})(CreateApp);


ReactDOM.render(<App />, document.querySelector('#root'));