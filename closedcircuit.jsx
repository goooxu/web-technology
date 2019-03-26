const CandidatePieceTypes = [10, 5, 12, 6, 3, 9];

class PieceView extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        switch (parseInt(this.props.type)) {
            case 10: return <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M 0 12 24 12" stroke="#FFFF00" strokeWidth="4" />
            </svg>;
            case 5: return <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M 12 0 12 24" stroke="#FFFF00" strokeWidth="4" />
            </svg>;
            case 12: return <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M 0 12 12 12 12 24" stroke="#FFFF00" strokeWidth="4" strokeLinejoin="round" fill="transparent" />
            </svg>;
            case 6: return <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M 12 24 12 12 24 12" stroke="#FFFF00" strokeWidth="4" strokeLinejoin="round" fill="transparent" />
            </svg>;
            case 3: return <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M 24 12 12 12 12 0" stroke="#FFFF00" strokeWidth="4" strokeLinejoin="round" fill="transparent" />
            </svg>;
            case 9: return <svg width="24" height="24" viewBox="0 0 24 24">
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
        this.props.moveStart(this.props.pieceType);
    }

    handleDragEnd(e) {
        this.props.moveEnd(-1, 0);
    }

    render() {
        return (
            <div className="grid grid-candidate" draggable={true} onDragStart={this.handleDragStart} onDragEnd={this.handleDragEnd}>
                <PieceView type={this.props.pieceType} />
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
        if (this.props.state === 2) {
            e.preventDefault();
        }
    }

    handleDragEnter(e) {
        if (this.props.state === 2) {
            this.setState({ hover: true });
        }
    }

    handleDragLeave(e) {
        if (this.props.state === 2) {
            this.setState({ hover: false });
        }
    }

    handleDrop(e) {
        if (this.props.state === 2) {
            this.props.moveEnd(this.props.index, e.dataTransfer.getData('pieceType'));
            this.setState({ hover: false });
        }
    }

    getClassName() {
        if (this.props.state === 0) {
            return 'grid';
        }
        if (this.props.state === 1) {
            return 'grid grid-occupied';
        } else if (this.props.state === 2) {
            if (this.state.hover) {
                return 'grid grid-available grid-hover';
            } else {
                return 'grid grid-available'
            }
        }
    }

    render() {
        return <div className={this.getClassName()}
            onDragOver={this.handleDragOver}
            onDragEnter={this.handleDragEnter}
            onDragLeave={this.handleDragLeave}
            onDrop={this.handleDrop}>
            {this.props.state == 1 ? <PieceView type={this.props.pieceType} /> : <React.Fragment />}
        </div>;
    }
}

class Piece {
    constructor(flag = 0x10) {
        this.flag = flag;
    }

    get blank() {
        return (this.flag & 0x10) !== 0;
    }

    get occupied() {
        return (this.flag & 0x20) !== 0;
    }

    get links() {
        if ((this.flag & 0x10) !== 0) {
            return this.flag & 0x0f;
        }
    }

    tryIncreaseLink() {
        if ((this.flag & 0x10) !== 0) {
            this.flag += 1;
        }
    }

    /* 1-up, 2-right, 4-down, 8-left*/
    get type() {
        if ((this.flag & 0x20) === 0) {
            return 0;
        } else {
            return this.flag & 0x0f;
        }
    }

    occupy(type) {
        this.flag = 0x20 | type;
    }
}

class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            movingPieceType: 0,
            chessPieces: Array(256).fill().map(() => new Piece())
        };
        this.moveStart = this.moveStart.bind(this);
        this.moveEnd = this.moveEnd.bind(this);
        this.checkAvailable = this.checkAvailable.bind(this);
    }

    moveStart(pieceType) {
        this.setState({ movingPieceType: pieceType });
    }

    moveEnd(index, pieceType) {
        if (this.state.movingPieceType !== 0) {
            this.setState(
                state => {
                    state.movingPieceType = 0;
                    if (index !== -1) {
                        state.chessPieces[index].occupy(pieceType);
                        this.increaseSurroundingPieceLinks(state.chessPieces, index, pieceType);
                    }
                    return state;
                }
            );
        }
    }

    getNeighboringIndex(index, direction) {
        const row = Math.floor(index / 16);
        const column = index % 16;

        switch (direction) {
            case 0:
                if (row !== 0) {
                    return index - 16;
                }
                break;
            case 1:
                if (column !== 15) {
                    return index + 1;
                }
                break;
            case 2:
                if (row !== 15) {
                    return index + 16;
                }
                break;
            case 3:
                if (column !== 0) {
                    return index - 1;
                }
                break;
        }

        return -1;
    }

    increaseSurroundingPieceLinks(chessPieces, index, pieceType) {
        for (let direction = 0; direction < 4; direction++) {
            if ((pieceType & (1 << direction)) !== 0) {
                const neighboringIndex = this.getNeighboringIndex(index, direction);
                if (neighboringIndex !== -1) {
                    chessPieces[neighboringIndex].tryIncreaseLink();
                }
            }
        }
    }

    travelForLoop(index, pieceType) {
        const startIndex = index;
        let step = 0;
        let sourceDirection = 0;

        while (!(step !== 0 && index === startIndex)) {
            let direction = 0;
            for (; direction < 4; direction++) {
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
                    if (!oppositePiece.occupy || (oppositePiece.type & oppositeMask) === 0) {
                        continue;
                    }
                    pieceType = oppositePiece.type;
                }

                index = oppositeIndex;
                sourceDirection = ((direction + 2) % 4);
                step++;

                break;
            }

            if (direction === 4) {
                return [false];
            }
        }

        return [true, step];
    }

    checkAvailable(index, movingPieceType) {
        if (this.state.chessPieces[index].occupied) {
            return 1;
        }

        for (let direction = 0; direction < 4; direction++) {
            const mask = 1 << direction;
            const oppositeMask = 1 << ((direction + 2) % 4);
            const oppositeIndex = this.getNeighboringIndex(index, direction);

            if (oppositeIndex !== -1) {
                const oppositePiece = this.state.chessPieces[oppositeIndex];
                if (oppositePiece.occupied) {
                    if ((movingPieceType & mask) === 0 && (oppositePiece.type & oppositeMask) !== 0) {
                        return 0;
                    }
                    if ((movingPieceType & mask) !== 0 && (oppositePiece.type & oppositeMask) === 0) {
                        return 0;
                    }
                } else if (oppositePiece.blank) {
                    if ((movingPieceType & mask) !== 0 && oppositePiece.links >= 2) {
                        return 0;
                    }
                }
            } else if ((movingPieceType & mask) !== 0) {
                return 0;
            }
        }

        const [success, length] = this.travelForLoop(index, movingPieceType);
        if (success) {
            console.log('Found loop, the length is', length);
            return 0;
        }

        return 2;
    }

    render() {
        return <React.Fragment>
            <h1>Closed Circui</h1>
            <div className="board">
                {this.state.chessPieces.map((piece, i) => {
                    if (piece.occupied) {
                        return <ChessGrid key={i} index={i} state={1} pieceType={piece.type} />
                    } else if (this.state.movingPieceType !== 0) {
                        return <ChessGrid key={i} index={i} state={this.checkAvailable(i, this.state.movingPieceType)} moveEnd={this.moveEnd} />
                    } else {
                        return <ChessGrid key={i} index={i} state={0} />
                    }
                })}
            </div>
            <hr></hr>
            <div className="candidates">
                {CandidatePieceTypes.map(i =>
                    <CandidateGrid key={i} pieceType={i} moveStart={this.moveStart} moveEnd={this.moveEnd} />
                )}
            </div>

        </React.Fragment>;
    }
}

ReactDOM.render(<Game />, document.querySelector('#root'));