const {
    AppBar,
    Button,
    Icon,
    IconButton,
    Toolbar,
    Typography,
    SvgIcon,
    withStyles
} = window['material-ui'];

const styles = {
    root: {
        flexGrow: 1,
    },
    grow: {
        flexGrow: 1,
    },
    menuButton: {
        marginLeft: -12,
        marginRight: 20,
    },
};

function ButtonAppBar(props) {
    const { classes } = props;
    return (
        <div className={classes.root}>
            <AppBar>
                <Toolbar>
                    <IconButton className={classes.menuButton} color="inherit" aria-label="Menu">
                        <Icon className={classes.icon}>menu</Icon>
                    </IconButton>
                    <Typography variant="h6" color="inherit" className={classes.grow}>
                        News
                    </Typography>
                    <Button color="inherit">Login</Button>
                </Toolbar>
            </AppBar>
        </div>
    );
}

const App = withStyles(styles)(ButtonAppBar);
ReactDOM.render(<App />, document.querySelector('#root'));