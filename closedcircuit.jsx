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
    WaitingChallengerJoin: 0,
    WaitingChallengerAck: 1,
    WinnerTurn: 2,
    ChallengerTurn: 3,
    WinnerChecking: 4,
    ChallengerChecking: 5,
    WinnerDefeat: 6,
    ChallengerDefeat: 7
});

const GameRoles = Object.freeze({
    None: 0,
    Winner: 1,
    Challenger: 2,
    Audience: 3
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

class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            gameRole: GameRoles.None,
            gameState: GameStates.WaitingChallengerJoin,
            chessPieces: Array(256).fill().map(() => new Piece()),
            remainingPieces: 48,
            remainingPiecesInThisTurn: 3,
            droppingPieceType: PieceTypes.None,
            drop_history: [],
            messages: [],
        };
        this.action_history = [];
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
        this.onConnected = this.onConnected.bind(this);
        this.onReceiveMessage = this.onReceiveMessage.bind(this);
        this.handleEndTurnClick = this.handleEndTurnClick.bind(this);
        this.handleDeclareNoSolutionClick = this.handleDeclareNoSolutionClick.bind(this);
        this.handleAdmitDefeatClick = this.handleAdmitDefeatClick.bind(this);
    }

    componentDidMount() {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl(ApiBaseUrl)
            .configureLogging(signalR.LogLevel.Information)
            .build();
        connection.on('message', this.onReceiveMessage);
        connection.onclose(() => console.log('Server disconnected'));

        console.log('Server connecting...');
        connection.start().then(this.onConnected).catch(console.error);
    }

    onConnected() {
        console.log('Server connected');
        if (!this.props.owner) {
            this.sendMessage('join');
        }
    }

    onReceiveMessage(message) {
        if (message.roomKey === this.props.roomKey) {
            console.log('$', message);

            if (message.cmd === 'immediate') {
                this.onReceiveImmediateGameActions(message.actions);
            } else if (message.cmd === 'replay') {
                this.onReceiveReplayGameActions(message.target, message.actions);
            } else if (message.cmd === 'join') {
                this.onReceiveJoinMessage(message.sender);
            } else if (message.cmd === 'assign') {
                this.onReceiveAssignMessage(message.target, message.role);
            } else if (message.cmd === 'ready') {
                this.onReceiveReadyMessage(message.sender, message.role);
            }
        }
    }

    onGameActions(actions) {
        const outActions = [];
        this.setState(state => {
            for (const item of actions) {
                if (item.action === 'drop') {
                    state.remainingPieces -= 1;
                    state.chessPieces[item.index].occupy(item.pieceType);
                    this.increaseSurroundingPieceLinks(state.chessPieces, item.index, item.pieceType);
                    if (state.drop_history.length > 0 && state.drop_history[state.drop_history.length - 1].role === item.role) {
                        state.drop_history[state.drop_history.length - 1].indexes.push(item.index);
                    } else {
                        state.drop_history.push({ role: item.role, indexes: [item.index] });
                    }
                    if (this.props.owner) {
                        if (this.checkForLoop(item.index)) {
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
                        state.gameState = GameStates.ChallengerTurn;
                    } else if (item.role === GameRoles.Challenger) {
                        state.gameState = GameStates.WinnerTurn;
                    }
                    state.remainingPiecesInThisTurn = Math.min(3, state.remainingPieces);
                } else if (item.action === 'declareNoSolution') {
                    if (item.role === GameRoles.Winner) {
                        state.gameState = GameStates.ChallengerChecking;
                        state.messages.push(<span>擂主宣称无解，挑战者需要推翻这个结论或者认输</span>);
                    } else if (item.role === GameRoles.Challenger) {
                        state.gameState = GameStates.WinnerChecking;
                        state.messages.push(<span>挑战者宣称无解，擂主需要推翻这个结论或者认输</span>);
                    }
                    state.remainingPiecesInThisTurn = state.remainingPieces;
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
                    state.gameState = GameStates.WinnerTurn;
                    state.messages.push(<span>挑战者已经进入房间，游戏开始，由擂主先走</span>);
                } else if (item.action === 'endGame') {
                    if (item.victor === GameRoles.Winner) {
                        state.gameState = GameStates.WinnerDefeat;
                        state.messages.push(<span><b>游戏结束，擂主获胜</b></span>);
                    } else if (item.victor === GameRoles.Challenger) {
                        state.gameState = GameStates.ChallengerDefeat;
                        state.messages.push(<span><b>游戏结束，挑战者获胜</b></span>);
                    }
                }
            }
            return state;
        }, () => {
            if (outActions.length !== 0) {
                this.sendGameActions(outActions);
            }
        });
    }

    onReceiveImmediateGameActions(actions) {
        if (this.props.owner) {
            this.action_history.push(...actions);
        }
        this.onGameActions(actions);
    }

    onReceiveReplayGameActions(target, actions) {
        if (target === this.props.identity) {
            this.onGameActions(actions);
        }
    }

    onReceiveJoinMessage(sender) {
        if (this.props.owner) {
            if (this.state.gameState === GameStates.WaitingChallengerJoin) {
                let success = false;
                this.setState(state => {
                    if (state.gameState === GameStates.WaitingChallengerJoin) {
                        state.gameState = GameStates.WaitingChallengerAck;
                        success = true;
                    };
                    return state;
                }, () => {
                    if (success) {
                        this.sendMessage('assign', { target: sender, role: GameRoles.Challenger });
                    }
                });
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
                this.sendGameActions([{ action: 'startGame' }]);
            } else if (role === GameRoles.Audience) {
                this.sendMessage('replay', { target: sender, actions: this.action_history });
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

    isOwnActive() {
        return this.state.gameRole === GameRoles.Winner && this.isWinnerActive() ||
            this.state.gameRole === GameRoles.Challenger && this.isChallengerActive();
    }

    isWinnerActive() {
        return this.state.gameState === GameStates.WinnerTurn || this.state.gameState === GameStates.WinnerChecking;
    }

    isChallengerActive() {
        return this.state.gameState === GameStates.ChallengerTurn || this.state.gameState === GameStates.ChallengerChecking;
    }

    handleEndTurnClick() {
        if (this.isOwnActive()) {
            this.sendGameActions([{ action: 'endTurn' }]);
        }
    }

    handleDeclareNoSolutionClick() {
        if (this.isOwnActive()) {
            this.sendGameActions([{ action: 'declareNoSolution' }]);
        }
    }

    handleAdmitDefeatClick() {
        if (this.isOwnActive()) {
            this.sendGameActions([{ action: 'admitDefeat' }]);
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
                        state.remainingPiecesInThisTurn -= 1;
                        outActions.push({
                            action: 'drop',
                            index,
                            pieceType
                        });
                        if (state.remainingPiecesInThisTurn === 0) {
                            outActions.push({
                                action: 'endTurn'
                            });
                        }
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

    checkForLoop(index) {
        const startIndex = index;
        let step = 0;
        let sourceDirection = 0;

        while (!(step !== 0 && index === startIndex)) {
            const pieceType = this.state.chessPieces[index].pieceType;

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
                sourceDirection = ((direction + 2) % 4);
                step++;
                success = true;

                break;
            }

            if (!success) {
                return false;
            }
        }

        return true;
    }

    checkForNeighbor(index, originIndex, distance) {
        const rowOffset = Math.abs(Math.floor(index / 16) - Math.floor(originIndex / 16));
        const columnOffset = Math.abs(index % 16 - originIndex % 16);

        return ((rowOffset <= distance) && columnOffset === 0) ||
            ((columnOffset <= distance) && rowOffset === 0);
    }

    getOccupiedGridState(index) {
        for (let i = Math.max(0, this.state.drop_history.length - 2); i < this.state.drop_history.length; i++) {
            if (this.state.drop_history[i].indexes.includes(index)) {
                if (this.state.gameRole === GameRoles.Audience) {
                    return (this.state.drop_history[i].role === GameRoles.Winner) ? GridStates.OccupiedByOwn : GridStates.OccupiedByOpponent;
                } else {
                    return (this.state.drop_history[i].role === this.state.gameRole) ? GridStates.OccupiedByOwn : GridStates.OccupiedByOpponent;
                }
            }
        }

        return GridStates.Occupied;
    }

    getAvailableGridState(index) {
        if ((this.state.gameState === GameStates.WinnerTurn || this.state.gameState === GameStates.ChallengerTurn) && this.state.drop_history.length !== 0) {
            const record = this.state.drop_history[this.state.drop_history.length - 1];
            if (record.role === this.state.gameRole && !record.indexes.every(dropIndex =>
                this.checkForNeighbor(index, dropIndex, this.state.drop_history[this.state.drop_history.length - 1].indexes.length))) {
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
                } else if (oppositePiece.blank) {
                    if ((this.state.droppingPieceType & mask) !== 0 && oppositePiece.links >= 2) {
                        return GridStates.Blank;
                    }
                }
            } else if ((this.state.droppingPieceType & mask) !== 0) {
                return GridStates.Blank;
            }
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
                } else if (this.isWinnerActive()) {
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
                } else if (this.isChallengerActive()) {
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
                    {(this.state.gameState === GameStates.WinnerTurn || this.state.gameState === GameStates.ChallengerTurn) && <button onClick={this.handleEndTurnClick}>结束回合</button>}
                    {(this.state.gameState === GameStates.WinnerTurn || this.state.gameState === GameStates.ChallengerTurn) && <button onClick={this.handleDeclareNoSolutionClick}>宣称无解</button>}
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
            <p><a href="https://github.com/goooxu/web-technology/issues/1" target="_blank">游戏规则</a></p>
        </div>;
    }
}

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            setting: true,
            owner: false,
            roomKey: undefined
        };
        this.createGame = this.createGame.bind(this);
        this.joinGame = this.joinGame.bind(this);
    }

    createGame() {
        this.setState({
            setting: false,
            roomKey: uniqueIdentity(8),
            owner: true
        });
    }

    joinGame(roomKey) {
        this.setState({
            setting: false,
            roomKey,
            owner: false
        });
    }

    render() {
        return <React.Fragment>
            <h1 className="center">闭合回路挑战</h1>
            {this.state.setting ? <Menu createGame={this.createGame} joinGame={this.joinGame} /> : <Game roomKey={this.state.roomKey} owner={this.state.owner} identity={uniqueIdentity(8)} />}
            <hr></hr>
            <p className="center">Powered by GitHub Pages, React, Azure Functions, SignalR Service</p>
        </React.Fragment>;
    }
}

ReactDOM.render(<App />, document.querySelector('#root'));