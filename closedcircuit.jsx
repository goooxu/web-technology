const Directions = Object.freeze({
    Up: 0,
    Right: 1,
    Down: 2,
    Left: 3
});

const PieceTypes = Object.freeze({
    None: 0,
    HorizontalLine: 10,
    RightDownCorner: 6,
    LeftDownCorner: 12,
    VerticalLine: 5,
    RightUpCorner: 3,
    LeftUpCorner: 9
});

const GridStates = Object.freeze({
    Blank: 0,
    Alternative: 1,
    Occupied: 2,
    OccupiedByOwn: 3,
    OccupiedByOpponent: 4
});

const GameStates = Object.freeze({
    WaitingGameStart: 0,
    WinnerDropping: 1,
    ChallengerDropping: 2,
    WinnerChecking: 3,
    ChallengerChecking: 4,
    WinnerDefeat: 5,
    ChallengerDefeat: 6
});

const GameRoles = Object.freeze({
    Undetermined: 0,
    Winner: 1,
    Challenger: 2,
    Audience: 3
});

const AppStates = Object.freeze({
    Connecting: 0,
    ConnectFailed: 1,
    Setting: 2,
    Gaming: 3
});

const ApiBaseUrl = 'https://closedcircuit.azurewebsites.net/api';

function toChar(index) {
    if (index < 26) return index + 97;
    else if (index < 52) return index - 26 + 65;
    else return index - 52 + 48;
}

function uniqueIdentity(len) {
    const byteLength = Math.ceil((Math.log2(52) + Math.log2(62) * (len - 1)) / 8);
    const bytes = new Uint8Array(byteLength);
    window.crypto.getRandomValues(bytes);
    let num = bytes.reduce((a, b) => a * 256 + b, 0);
    const codes = [];
    codes.push(toChar(num % 52));
    num = Math.floor(num / 52);
    for (let i = 1; i < len; i++) {
        codes.push(toChar(num % 62));
        num = Math.floor(num / 62);
    }
    return String.fromCharCode(...codes);
}

class PieceView extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        switch (this.props.pieceType) {
            case PieceTypes.HorizontalLine:
                return <svg width="24" height="24" viewBox="0 0 24 24">
                    <path d="M 0 12 24 12" stroke="#FFFF00" strokeWidth="4" />
                </svg>;
            case PieceTypes.VerticalLine:
                return <svg width="24" height="24" viewBox="0 0 24 24">
                    <path d="M 12 0 12 24" stroke="#FFFF00" strokeWidth="4" />
                </svg>;
            case PieceTypes.LeftDownCorner:
                return <svg width="24" height="24" viewBox="0 0 24 24">
                    <path d="M 0 12 12 12 12 24" stroke="#FFFF00" strokeWidth="4" strokeLinejoin="round" fill="transparent" />
                </svg>;
            case PieceTypes.RightDownCorner:
                return <svg width="24" height="24" viewBox="0 0 24 24">
                    <path d="M 12 24 12 12 24 12" stroke="#FFFF00" strokeWidth="4" strokeLinejoin="round" fill="transparent" />
                </svg>;
            case PieceTypes.RightUpCorner:
                return <svg width="24" height="24" viewBox="0 0 24 24">
                    <path d="M 24 12 12 12 12 0" stroke="#FFFF00" strokeWidth="4" strokeLinejoin="round" fill="transparent" />
                </svg>;
            case PieceTypes.LeftUpCorner:
                return <svg width="24" height="24" viewBox="0 0 24 24">
                    <path d="M 12 0 12 12 0 12" stroke="#FFFF00" strokeWidth="4" strokeLinejoin="round" fill="transparent" />
                </svg>;
        }

    }
}

class CandidateGrid extends React.Component {
    constructor(props) {
        super(props);
        this.handleDragStart = this.handleDragStart.bind(this);
        this.handleDragEnd = this.handleDragEnd.bind(this);
    }

    handleDragStart(e) {
        e.dataTransfer.setData('pieceType', this.props.pieceType);
        this.props.dropStart(this.props.pieceType);
    }

    handleDragEnd(e) {
        this.props.dropEnd(-1, 0);
    }

    render() {
        return (
            <div className="grid grid-candidate" draggable={true} onDragStart={this.handleDragStart} onDragEnd={this.handleDragEnd}>
                <PieceView pieceType={this.props.pieceType} />
            </div>
        );
    }
}

class ChessGrid extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hover: false };
        this.handleDragOver = this.handleDragOver.bind(this);
        this.handleDragEnter = this.handleDragEnter.bind(this);
        this.handleDragLeave = this.handleDragLeave.bind(this);
        this.handleDrop = this.handleDrop.bind(this);
    }

    handleDragOver(e) {
        if (this.props.gridState === GridStates.Alternative) {
            e.preventDefault();
        }
    }

    handleDragEnter(e) {
        if (this.props.gridState === GridStates.Alternative) {
            this.setState({ hover: true });
        }
    }

    handleDragLeave(e) {
        if (this.props.gridState === GridStates.Alternative) {
            this.setState({ hover: false });
        }
    }

    handleDrop(e) {
        if (this.props.gridState === GridStates.Alternative) {
            this.props.dropEnd(this.props.index, parseInt(e.dataTransfer.getData('pieceType')));
            this.setState({ hover: false });
        }
    }

    getClassName() {
        switch (this.props.gridState) {
            case GridStates.Blank: return 'grid';
            case GridStates.Alternative: return this.state.hover ? 'grid grid-available grid-hover' : 'grid grid-available';
            case GridStates.Occupied: return 'grid grid-occupied';
            case GridStates.OccupiedByOwn: return 'grid grid-occupied grid-own-drop';
            case GridStates.OccupiedByOpponent: return 'grid grid-occupied grid-opponent-drop';
        }
    }

    render() {
        return <div className={this.getClassName()}
            onDragOver={this.handleDragOver}
            onDragEnter={this.handleDragEnter}
            onDragLeave={this.handleDragLeave}
            onDrop={this.handleDrop}>
            {(this.props.gridState === GridStates.Occupied || this.props.gridState === GridStates.OccupiedByOwn || this.props.gridState === GridStates.OccupiedByOpponent) && <PieceView pieceType={this.props.pieceType} />}
        </div>;
    }
}

class Piece {
    constructor() {
        this._occupied = false;
        this._pieceType = PieceTypes.None;
        this._links = 0;
    }

    get occupied() {
        return this._occupied;
    }

    get links() {
        if (!this._occupied) {
            return this._links;
        }
    }

    tryIncreaseLink() {
        if (!this._occupied) {
            this._links += 1;
        }
    }

    get pieceType() {
        if (this._occupied) {
            return this._pieceType;
        }
    }

    occupy(pieceType) {
        this._occupied = true;
        this._pieceType = pieceType;
    }
}

class Connection {
    constructor(baseUrl) {
        this.listeners = [[], [], [], []];
        this.types = ['connect', 'disconnect', 'message', 'error'];

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(baseUrl)
            .configureLogging(signalR.LogLevel.Information)
            .build();
        this.connection.on('message', message => {
            for (const listener of this.listeners[2]) {
                listener(message);
            }
        });
        this.connection.onclose(() => {
            console.log('Server disconnected');
            for (const listener of this.listeners[1]) {
                listener();
            }
        });
    }

    start() {
        this.connection.start().then(() => {
            console.log('Server connected');
            for (const listener of this.listeners[0]) {
                listener();
            }
        }).catch(e => {
            for (const listener of this.listeners[3]) {
                listener(e);
            }
        });
        console.log('Server connecting...');
    }

    on(type, listener) {
        const typeId = this.types.indexOf(type);
        if (typeId === -1) {
            return;
        }
        this.listeners[typeId].push(listener);
    }

    off(type, listener) {
        const typeId = this.types.indexOf(type);
        if (typeId === -1) {
            return;
        }
        const index = this.listeners[typeId].indexOf(listener);
        if (index === -1) {
            return;
        }

        this.listeners[typeId].splice(index, 1);
    }
}

class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            chessPieces: Array(256).fill().map(() => new Piece()),
            gameRole: GameRoles.Undetermined,
            gameState: GameStates.WaitingGameStart,
            remainingPieces: 48,
            remainingPiecesInThisTurn: 3,
            droppingPieceType: PieceTypes.None,
            pendingNetworkRequests: 0,
            dropHistory: [],
            messages: [<span><a href="https://github.com/goooxu/web-technology/issues/1" target="_blank">游戏规则</a></span>],
        };
        this.actionHistory = [];
        this.waitingChallengerJoin = true;
        if (props.owner) {
            this.state.gameRole = GameRoles.Winner;
            this.state.messages.push(
                <span>已创建房间（代码 <b>{props.roomKey}</b>），请将代码发送给您的朋友，他们便可以加入这个房间挑战你</span>,
                <span>你的角色是<b>擂主</b></span>,
                <span>等待挑战者和观众加入房间</span>
            );
        } else {
            this.state.messages.push(
                <span>已进入房间（代码 <b>{props.roomKey}</b>），正在等待分配角色</span>
            );
        }
        this.dropStart = this.dropStart.bind(this);
        this.dropEnd = this.dropEnd.bind(this);
        this.getOccupiedGridState = this.getOccupiedGridState.bind(this);
        this.getAvailableGridState = this.getAvailableGridState.bind(this);
        this.onReceiveMessage = this.onReceiveMessage.bind(this);
        this.handleEndTurnClick = this.handleEndTurnClick.bind(this);
        this.handleDeclareNoSolutionClick = this.handleDeclareNoSolutionClick.bind(this);
        this.handleAdmitDefeatClick = this.handleAdmitDefeatClick.bind(this);
    }

    componentDidMount() {
        this.props.connection.on('message', this.onReceiveMessage);
        if (!this.props.owner) {
            this.sendMessage('join');
        }
    }

    componentWillUnmount() {
        this.props.connection.off('message', this.onReceiveMessage);
    }

    onReceiveMessage(message) {
        if (message.roomKey === this.props.roomKey) {
            //console.log('$', message);

            if (message.cmd === 'immediate') {
                this.onReceiveImmediateGameActions(message.sender, message.actions);
            } else if (message.cmd === 'replay') {
                this.onReceiveReplayGameActions(message.sender, message.target, message.actions);
            } else if (message.cmd === 'join') {
                this.onReceiveJoinMessage(message.sender);
            } else if (message.cmd === 'assign') {
                this.onReceiveAssignMessage(message.target, message.role);
            } else if (message.cmd === 'ready') {
                this.onReceiveReadyMessage(message.sender, message.role);
            }
        }
    }

    onGameActions(sender, actions) {
        const outActions = [];
        this.setState(state => {
            if (sender === this.props.identity) {
                state.pendingNetworkRequests -= 1;
            }
            for (const item of actions) {
                if (item.action === 'drop') {
                    state.remainingPieces -= 1;
                    state.remainingPiecesInThisTurn -= 1;
                    state.chessPieces[item.index].occupy(item.pieceType);
                    this.increaseSurroundingPieceLinks(state.chessPieces, item.index, item.pieceType);
                    if (state.dropHistory.length > 0 && state.dropHistory[state.dropHistory.length - 1].role === item.role) {
                        state.dropHistory[state.dropHistory.length - 1].indexes.push(item.index);
                    } else {
                        state.dropHistory.push({ role: item.role, indexes: [item.index] });
                    }
                    if (this.props.owner) {
                        const loopLength = this.checkForLoop(item.index, item.pieceType);
                        if (loopLength !== 0 && loopLength === 48 - state.remainingPieces) {
                            outActions.push({ action: 'endGame', victor: item.role });
                        } else if (state.remainingPieces === 0) {
                            if (item.role === GameRoles.Winner) {
                                outActions.push({ action: 'endGame', victor: GameRoles.Challenger });
                            } else {
                                outActions.push({ action: 'endGame', victor: GameRoles.Winner });
                            }
                        }
                    }
                } else if (item.action === 'endTurn') {
                    if (item.role === GameRoles.Winner) {
                        state.gameState = GameStates.ChallengerDropping;
                    } else if (item.role === GameRoles.Challenger) {
                        state.gameState = GameStates.WinnerDropping;
                    }
                    if (this.isOwnActive()) {
                        state.remainingPiecesInThisTurn = Math.min(3, state.remainingPieces);
                    }
                } else if (item.action === 'declareNoSolution') {
                    if (item.role === GameRoles.Winner) {
                        state.gameState = GameStates.ChallengerChecking;
                        state.messages.push(<span>擂主宣称无解，挑战者需要推翻这个结论或者认输</span>);
                    } else if (item.role === GameRoles.Challenger) {
                        state.gameState = GameStates.WinnerChecking;
                        state.messages.push(<span>挑战者宣称无解，擂主需要推翻这个结论或者认输</span>);
                    }
                    if (this.isOwnActive()) {
                        state.remainingPiecesInThisTurn = state.remainingPieces;
                    }
                } else if (item.action === 'admitDefeat') {
                    if (item.role === GameRoles.Winner) {
                        state.messages.push(<span>擂主认输</span>);
                    } else if (item.role === GameRoles.Challenger) {
                        state.messages.push(<span>挑战者认输</span>);
                    }
                    if (this.props.owner) {
                        if (item.role === GameRoles.Winner) {
                            outActions.push({ action: 'endGame', victor: GameRoles.Challenger });
                        } else if (item.role === GameRoles.Challenger) {
                            outActions.push({ action: 'endGame', victor: GameRoles.Winner });
                        }
                    }
                } else if (item.action === 'startGame') {
                    state.gameState = GameStates.WinnerDropping;
                    state.messages.push(<span>挑战者已经进入房间，游戏开始，由擂主先走</span>);
                } else if (item.action === 'endGame') {
                    if (item.victor === GameRoles.Winner) {
                        state.gameState = GameStates.WinnerDefeat;
                        state.messages.push(<span><b>游戏结束，擂主获胜</b></span>);
                    } else if (item.victor === GameRoles.Challenger) {
                        state.gameState = GameStates.ChallengerDefeat;
                        state.messages.push(<span><b>游戏结束，挑战者获胜</b></span>);
                    }
                    state.messages.push(<span>请刷新页面重新开始游戏</span>);
                }
            }
            if (outActions.length !== 0) {
                state.pendingNetworkRequests += 1;
            }
            return state;
        }, () => {
            if (outActions.length !== 0) {
                this.sendGameActions(outActions);
            }
        });
    }

    onReceiveImmediateGameActions(sender, actions) {
        if (this.props.owner) {
            this.actionHistory.push(...actions);
        }
        this.onGameActions(sender, actions);
    }

    onReceiveReplayGameActions(sender, target, actions) {
        if (target === this.props.identity) {
            this.onGameActions(sender, actions);
        }
    }

    onReceiveJoinMessage(sender) {
        if (this.props.owner) {
            if (this.waitingChallengerJoin) {
                this.waitingChallengerJoin = false;
                this.sendMessage('assign', { target: sender, role: GameRoles.Challenger });
            } else {
                this.sendMessage('assign', { target: sender, role: GameRoles.Audience });
            }
        }
    }

    onReceiveAssignMessage(target, role) {
        if (target === this.props.identity) {
            this.setState(state => {
                state.gameRole = role;
                if (role === GameRoles.Challenger) {
                    this.state.messages.push(
                        <span>你的角色是<b>挑战者</b></span>
                    );
                } else if (role === GameRoles.Audience) {
                    this.state.messages.push(
                        <span>你的角色是<b>观众</b></span>
                    );
                }
                return state;
            }, () => this.sendMessage('ready', { role }));
        }
    }

    onReceiveReadyMessage(sender, role) {
        if (this.props.owner) {
            if (role === GameRoles.Challenger) {
                this.setState(state => {
                    state.pendingNetworkRequests += 1;
                    return state;
                }, () => this.sendGameActions([{ action: 'startGame' }]));
            } else if (role === GameRoles.Audience) {
                this.sendMessage('replay', { target: sender, actions: this.actionHistory });
            }
        }
    }

    sendMessage(cmd, body) {
        const header = { cmd, roomKey: this.props.roomKey, sender: this.props.identity };
        fetch(`${ApiBaseUrl}/message`, { method: 'POST', body: JSON.stringify({ ...header, ...body }) });
    }

    sendGameActions(actions) {
        this.sendMessage('immediate', {
            actions: actions.map(action => {
                action.role = this.state.gameRole;
                return action;
            })
        });
    }

    isWinnerTurn() {
        return this.state.gameState === GameStates.WinnerDropping || this.state.gameState === GameStates.WinnerChecking;
    }

    isChallengerTurn() {
        return this.state.gameState === GameStates.ChallengerDropping || this.state.gameState === GameStates.ChallengerChecking;
    }

    isOwnTurn() {
        return this.state.gameRole === GameRoles.Winner && this.isWinnerTurn() ||
            this.state.gameRole === GameRoles.Challenger && this.isChallengerTurn();
    }

    isOwnActive() {
        return this.state.pendingNetworkRequests === 0 && this.isOwnTurn();
    }

    handleEndTurnClick() {
        if (this.isOwnActive()) {
            this.setState(state => {
                state.pendingNetworkRequests += 1;
                return state;
            }, () => this.sendGameActions([{ action: 'endTurn' }]));
        }
    }

    handleDeclareNoSolutionClick() {
        if (this.isOwnActive()) {
            this.setState(state => {
                state.pendingNetworkRequests += 1;
                return state;
            }, () => this.sendGameActions([{ action: 'declareNoSolution' }]));
        }
    }

    handleAdmitDefeatClick() {
        if (this.isOwnActive()) {
            this.setState(state => {
                state.pendingNetworkRequests += 1;
                return state;
            }, () => this.sendGameActions([{ action: 'admitDefeat' }]));
        }
    }

    dropStart(pieceType) {
        if (this.isOwnActive()) {
            this.setState({ droppingPieceType: pieceType });
        }
    }

    dropEnd(index, pieceType) {
        if (this.isOwnActive() && this.state.droppingPieceType !== PieceTypes.None) {
            const outActions = [];
            this.setState(
                state => {
                    state.droppingPieceType = PieceTypes.None;
                    if (index !== -1) {
                        outActions.push({
                            action: 'drop',
                            index,
                            pieceType
                        });
                        if (state.remainingPiecesInThisTurn === 1) {
                            outActions.push({
                                action: 'endTurn'
                            });
                        }
                    }
                    if (outActions.length !== 0) {
                        state.pendingNetworkRequests += 1;
                    }
                    return state;
                }, () => {
                    if (outActions.length !== 0) {
                        this.sendGameActions(outActions);
                    }
                }
            );
        }
    }

    getNeighboringIndex(index, direction) {
        const row = Math.floor(index / 16);
        const column = index % 16;

        switch (direction) {
            case Directions.Up:
                if (row !== 0) {
                    return index - 16;
                }
                break;
            case Directions.Right:
                if (column !== 15) {
                    return index + 1;
                }
                break;
            case Directions.Down:
                if (row !== 15) {
                    return index + 16;
                }
                break;
            case Directions.Left:
                if (column !== 0) {
                    return index - 1;
                }
                break;
        }

        return -1;
    }

    increaseSurroundingPieceLinks(chessPieces, index, pieceType) {
        for (const direction of Object.values(Directions)) {
            if ((pieceType & (1 << direction)) !== 0) {
                const neighboringIndex = this.getNeighboringIndex(index, direction);
                if (neighboringIndex !== -1) {
                    chessPieces[neighboringIndex].tryIncreaseLink();
                }
            }
        }
    }

    checkForLoop(index, pieceType) {
        const startIndex = index;
        let steps = 0;
        let sourceDirection = 0;

        while (!(steps !== 0 && index === startIndex)) {
            let success = false;
            for (const direction of Object.values(Directions)) {
                if (direction === sourceDirection) {
                    continue;
                }

                const mask = 1 << direction;
                if ((pieceType & mask) === 0) {
                    continue;
                }

                const oppositeMask = 1 << ((direction + 2) % 4);
                const oppositeIndex = this.getNeighboringIndex(index, direction);

                if (oppositeIndex !== startIndex) {
                    const oppositePiece = this.state.chessPieces[oppositeIndex];
                    if (!oppositePiece.occupy || (oppositePiece.pieceType & oppositeMask) === 0) {
                        continue;
                    }
                }

                index = oppositeIndex;
                pieceType = this.state.chessPieces[index].pieceType;
                sourceDirection = ((direction + 2) % 4);
                steps++;
                success = true;

                break;
            }

            if (!success) {
                return 0;
            }
        }

        return steps;
    }

    checkForNeighbor(index, originIndex, distance) {
        const rowOffset = Math.abs(Math.floor(index / 16) - Math.floor(originIndex / 16));
        const columnOffset = Math.abs(index % 16 - originIndex % 16);

        return ((rowOffset <= distance) && columnOffset === 0) ||
            ((columnOffset <= distance) && rowOffset === 0);
    }

    getOccupiedGridState(index) {
        for (let i = Math.max(0, this.state.dropHistory.length - 2); i < this.state.dropHistory.length; i++) {
            if (this.state.dropHistory[i].indexes.includes(index)) {
                if (this.state.gameRole === GameRoles.Audience) {
                    return (this.state.dropHistory[i].role === GameRoles.Winner) ? GridStates.OccupiedByOwn : GridStates.OccupiedByOpponent;
                } else {
                    return (this.state.dropHistory[i].role === this.state.gameRole) ? GridStates.OccupiedByOwn : GridStates.OccupiedByOpponent;
                }
            }
        }

        return GridStates.Occupied;
    }

    getAvailableGridState(index) {
        if ((this.state.gameState === GameStates.WinnerDropping || this.state.gameState === GameStates.ChallengerDropping) && this.state.dropHistory.length !== 0) {
            const record = this.state.dropHistory[this.state.dropHistory.length - 1];
            if (record.role === this.state.gameRole && !record.indexes.every(dropIndex =>
                this.checkForNeighbor(index, dropIndex, this.state.dropHistory[this.state.dropHistory.length - 1].indexes.length))) {
                return GridStates.Blank;
            }
        }

        for (const direction of Object.values(Directions)) {
            const mask = 1 << direction;
            const oppositeMask = 1 << ((direction + 2) % 4);
            const oppositeIndex = this.getNeighboringIndex(index, direction);

            if (oppositeIndex !== -1) {
                const oppositePiece = this.state.chessPieces[oppositeIndex];
                if (oppositePiece.occupied) {
                    if ((this.state.droppingPieceType & mask) === 0 && (oppositePiece.pieceType & oppositeMask) !== 0) {
                        return GridStates.Blank;
                    }
                    if ((this.state.droppingPieceType & mask) !== 0 && (oppositePiece.pieceType & oppositeMask) === 0) {
                        return GridStates.Blank;
                    }
                } else {
                    if ((this.state.droppingPieceType & mask) !== 0 && oppositePiece.links >= 2) {
                        return GridStates.Blank;
                    }
                }
            } else if ((this.state.droppingPieceType & mask) !== 0) {
                return GridStates.Blank;
            }
        }

        const loopLength = this.checkForLoop(index, this.state.droppingPieceType);
        if (loopLength !== 0 && loopLength !== 48 - this.state.remainingPieces + 1) {
            return GridStates.Blank;
        }

        return GridStates.Alternative;
    }

    getDashboardClassName() {
        if (this.isOwnActive()) {
            return 'dashboard';
        } else {
            return 'dashboard disable';
        }
    }

    getScoreClassName(index) {
        switch (index) {
            case 0: {
                if (this.state.gameState === GameStates.WinnerDefeat) {
                    return 'score score-defeat';
                } else if (this.isWinnerTurn()) {
                    if (this.state.gameRole === GameRoles.Audience || this.isOwnActive()) {
                        return 'score score-own-active';
                    } else {
                        return 'score score-opponent-active';
                    }
                } else {
                    return 'score';
                }
                break;
            }
            case 1: {
                if (this.state.gameState === GameStates.ChallengerDefeat) {
                    return 'score score-defeat';
                } else if (this.isChallengerTurn()) {
                    if (this.state.gameRole === GameRoles.Audience || !this.isOwnActive()) {
                        return 'score score-opponent-active';
                    } else {
                        return 'score score-own-active';
                    }
                } else {
                    return 'score';
                }
                break;
            }
        }
    }

    render() {
        return <React.Fragment>
            <div className="board">
                {this.state.chessPieces.map((piece, i) => {
                    if (piece.occupied) {
                        return <ChessGrid key={i} index={i} gridState={this.getOccupiedGridState(i)} pieceType={piece.pieceType} />
                    } else if (this.state.droppingPieceType !== 0) {
                        return <ChessGrid key={i} index={i} gridState={this.getAvailableGridState(i)} dropEnd={this.dropEnd} />
                    } else {
                        return <ChessGrid key={i} index={i} gridState={GridStates.Blank} />
                    }
                })}
            </div>
            <hr></hr>
            <div className={this.getDashboardClassName()}>
                <span>总计剩余 <b>{this.state.remainingPieces}</b> 枚棋子</span>
                <div className="candidates">
                    {Object.values(PieceTypes).filter(i => i !== PieceTypes.None).map(i =>
                        <CandidateGrid key={i} pieceType={i} dropStart={this.dropStart} dropEnd={this.dropEnd} />
                    )}
                </div>
                <span>此回合剩余 <b>{this.state.remainingPiecesInThisTurn}</b> 枚棋子</span>
                <div className="toolbar">
                    {(this.state.gameState === GameStates.WinnerDropping || this.state.gameState === GameStates.ChallengerDropping) && this.state.remainingPiecesInThisTurn !== 3 && <button onClick={this.handleEndTurnClick}>结束回合</button>}
                    {(this.state.gameState === GameStates.WinnerDropping || this.state.gameState === GameStates.ChallengerDropping) && this.state.remainingPiecesInThisTurn === 3 && <button onClick={this.handleDeclareNoSolutionClick}>宣称无解</button>}
                    {(this.state.gameState === GameStates.WinnerChecking || this.state.gameState === GameStates.ChallengerChecking) && <button onClick={this.handleAdmitDefeatClick}>认输</button>}
                </div>
            </div>
            <hr></hr>
            <div className="scoreboard">
                <div className={this.getScoreClassName(0)}>
                    <h2>擂主</h2>
                    {this.state.gameRole === GameRoles.Winner && <span>你</span>}
                    {this.state.gameRole === GameRoles.Challenger && <span>你的对手</span>}
                </div>
                <h2>vs</h2>
                <div className={this.getScoreClassName(1)}>
                    <h2>挑战者</h2>
                    {this.state.gameRole === GameRoles.Winner && <span>你的对手</span>}
                    {this.state.gameRole === GameRoles.Challenger && <span>你</span>}
                </div>
            </div>
            <hr></hr>
            <div className="messageboard">
                {this.state.messages.map((message, i) => <React.Fragment key={i}>{message}</React.Fragment>)}
            </div>
        </React.Fragment>;
    }
}

class Menu extends React.Component {
    constructor(props) {
        super(props);
        this.handleCreateGame = this.handleCreateGame.bind(this);
        this.handleJoinGame = this.handleJoinGame.bind(this);
        this.handleRoomKeyChange = this.handleRoomKeyChange.bind(this);
        this.state = { roomKey: '' };
    }

    handleCreateGame() {
        this.props.createGame();
    }

    handleJoinGame() {
        this.props.joinGame(this.state.roomKey);
    }

    handleRoomKeyChange(e) {
        this.setState({
            roomKey: e.target.value
        });
    }

    render() {
        return <div className="menu">
            <button onClick={this.handleCreateGame}>创建一局游戏</button>
            <p>或者</p>
            <div><span>房间代码：</span><input value={this.state.roomKey} onChange={this.handleRoomKeyChange}></input></div>
            <button onClick={this.handleJoinGame} className={this.state.roomKey ? '' : 'disable'}>加入一局游戏</button>
            <p><a href="https://github.com/goooxu/web-technology/issues/1" target="_blank">游戏规则</a>&nbsp;&nbsp;<a href="https://github.com/goooxu/web-technology/issues/5" target="_blank">更新日志</a></p>
        </div>;
    }
}

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            appState: AppStates.Connecting,
            owner: false,
            roomKey: undefined
        };
        this.onConnectSucceeded = this.onConnectSucceeded.bind(this);
        this.onConnectFailed = this.onConnectFailed.bind(this);
        this.createGame = this.createGame.bind(this);
        this.joinGame = this.joinGame.bind(this);
    }

    componentDidMount() {
        this.connection = new Connection(ApiBaseUrl);
        this.connection.on('connect', this.onConnectSucceeded);
        this.connection.on('error', this.onConnectFailed);
        this.connection.start();
    }

    onConnectSucceeded() {
        this.setState({
            appState: AppStates.Setting
        });
        this.connection.off('connect', this.onConnectSucceeded);
        this.connection.off('error', this.onConnectFailed);
    }

    onConnectFailed() {
        this.setState({
            appState: AppStates.ConnectFailed
        });
        this.connection.off('connect', this.onConnectSucceeded);
        this.connection.off('error', this.onConnectFailed);
    }

    createGame() {
        this.setState({
            appState: AppStates.Gaming,
            roomKey: uniqueIdentity(8),
            owner: true
        });
    }

    joinGame(roomKey) {
        this.setState({
            appState: AppStates.Gaming,
            roomKey,
            owner: false
        });
    }

    getRenderScene() {
        switch (this.state.appState) {
            case AppStates.Connecting: {
                return <p className="center">匿名登录中，请不要手动刷新，请使用Chrome浏览器访问...</p>
            }
            case AppStates.ConnectFailed: {
                return <p className="center">登录失败，请刷新页面重试，请使用Chrome浏览器访问</p>
            }
            case AppStates.Setting: {
                return <Menu createGame={this.createGame} joinGame={this.joinGame} />;
            }
            case AppStates.Gaming: {
                return <Game connection={this.connection} roomKey={this.state.roomKey} owner={this.state.owner} identity={uniqueIdentity(8)} />;
            }
        }
    }

    render() {
        return <React.Fragment>
            <h1 className="center">闭合回路挑战</h1>
            {this.getRenderScene()}
            <hr></hr>
            <p className="center">Powered by GitHub Pages, React, Azure Functions, SignalR Service</p>
        </React.Fragment>;
    }
}

ReactDOM.render(<App />, document.querySelector('#root'));