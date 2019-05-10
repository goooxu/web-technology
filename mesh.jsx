class RandomNumberPool {
    constructor() {
        this.size = 1024;
        this.array = new Uint32Array(this.size);
        this.offset = 0;
        self.crypto.getRandomValues(this.array);
    }

    next() {
        if (this.offset === this.size) {
            self.crypto.getRandomValues(this.array);
            this.offset = 0;
        }
        return this.array[this.offset++];
    }
}

function distance(p1, p2) {
    return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
}

function anticlockwise(p1, p2, p3) {
    return Math.sign((p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y));
}

function intersectant(p1, p2, p3, p4) {
    return anticlockwise(p1, p2, p3) * anticlockwise(p1, p2, p4) === -1
        && anticlockwise(p3, p4, p1) * anticlockwise(p3, p4, p2) === -1;
}

class Network {
    constructor(width, height, pointNumber) {
        this._randomNumberPool = new RandomNumberPool();
        this._points = this.generatePoints(width, height, pointNumber);
        this._lines = new Map();
        this._boundingLineList = new Set();
        this._internalLineList = new Set();
        this._adjacencyList = Array.from({ length: pointNumber }, () => new Set());
    }

    distance(index1, index2) {
        return distance(this._points[index1], this._points[index2]);
    }

    anticlockwise(index1, index2, index3) {
        return anticlockwise(this._points[index1], this._points[index2], this._points[index3]);
    }

    intersectant(index1, index2, index3, index4) {
        return intersectant(this._points[index1], this._points[index2], this._points[index3], this._points[index4]);
    }

    lineIndexFromEndpointIndex(index1, index2) {
        return (index1 + index2) * (index1 + index2 + 1) / 2 + Math.min(index1, index2);
    }

    totalLength(lineList) {
        return lineList.reduce((length, lineIndex) => {
            const line = this._lines.get(lineIndex);
            return length + this.distance(line[0], line[1]);
        }, 0.0);
    }

    addBoundingLine(pointIndex1, pointIndex2) {
        const lineIndex = this.lineIndexFromEndpointIndex(pointIndex1, pointIndex2);
        this._lines.set(lineIndex, [pointIndex1, pointIndex2]);
        this._boundingLineList.add(lineIndex);
        this._adjacencyList[pointIndex1].add(pointIndex2);
        this._adjacencyList[pointIndex2].add(pointIndex1);
    }

    addInternalLine(pointIndex1, pointIndex2) {
        const lineIndex = this.lineIndexFromEndpointIndex(pointIndex1, pointIndex2);
        this._lines.set(lineIndex, [pointIndex1, pointIndex2]);
        this._internalLineList.add(lineIndex);
        this._adjacencyList[pointIndex1].add(pointIndex2);
        this._adjacencyList[pointIndex2].add(pointIndex1);
    }

    deleteInternalLine(pointIndex1, pointIndex2) {
        const lineIndex = this.lineIndexFromEndpointIndex(pointIndex1, pointIndex2);
        this._internalLineList.delete(lineIndex);
        this._adjacencyList[pointIndex1].delete(pointIndex2);
        this._adjacencyList[pointIndex2].delete(pointIndex1);
    }

    generatePoints(width, height, pointNumber) {
        const center = { x: width / 2, y: height / 2 };
        const radius2 = Math.pow(Math.min(width / 2, height / 2), 2);

        const points = [];
        while (points.length < pointNumber) {
            const point = {
                x: this._randomNumberPool.next() % width,
                y: this._randomNumberPool.next() % height
            };
            if ((point.x - center.x) * (point.x - center.x) + (point.y - center.y) * (point.y - center.y) < radius2) {
                points.push(point);
            }
        }

        return points;
    }

    normalizeTriangle(trianglePointList) {
        if (this.anticlockwise(...trianglePointList) !== 1) {
            [trianglePointList[1], trianglePointList[2]] = [trianglePointList[2], trianglePointList[1]];
        }
        return trianglePointList;
    }

    tangentRange(pointList, sourcePointIndex, scope) {
        if (!scope) {
            scope = [0, pointList.length];
        }
        let range = [scope[0], scope[0]];
        for (let i = scope[0]; i < (scope[0] > scope[1] ? scope[1] + pointList.length : scope[1]); i++) {
            if (this.anticlockwise(pointList[i % pointList.length], pointList[(i + 1) % pointList.length], sourcePointIndex) === -1) {
                if (range[0] === range[1]) {
                    range = [i, i + 1];
                } else if (range[1] === i) {
                    range[1] = i + 1;
                } else if (range[0] === scope[0]) {
                    range[0] = i;
                    range[1] = range[1] + pointList.length;
                }
            }
        }

        return [range[0] % pointList.length, range[1] % pointList.length];
    }

    findBoundingPolygon(pointList) {
        const bounding = pointList.length === this._points.length;
        if (pointList.length < 3) {
            return [pointList, []];
        }
        const availablePointList = new Set(pointList);
        const boundingPolygonPointList = this.normalizeTriangle(pointList.splice(0, 3));
        while (pointList.length !== 0) {
            const pointIndex = pointList.shift();
            const range = this.tangentRange(boundingPolygonPointList, pointIndex);
            if (range[0] < range[1]) {
                boundingPolygonPointList.splice(range[0] + 1, range[1] - range[0] - 1, pointIndex);
            } else if (range[0] > range[1]) {
                boundingPolygonPointList.splice(range[0] + 1);
                boundingPolygonPointList.splice(0, range[1], pointIndex);
            }
        }

        for (let i = 0; i < boundingPolygonPointList.length; i++) {
            if (bounding) {
                this.addBoundingLine(boundingPolygonPointList[i], boundingPolygonPointList[(i + 1) % boundingPolygonPointList.length]);
            } else {
                this.addInternalLine(boundingPolygonPointList[i], boundingPolygonPointList[(i + 1) % boundingPolygonPointList.length]);
            }
            availablePointList.delete(boundingPolygonPointList[i]);
        }
        return [boundingPolygonPointList, Array.from(availablePointList)];
    }

    connectPolygons(outerPointList, innerPointList) {
        if (innerPointList.length === 0) {
            if (outerPointList.length > 3) {
                for (let i = 2; i < outerPointList.length - 1; i++) {
                    this.addInternalLine(outerPointList[0], outerPointList[i], 0);
                }
            }
        } else if (innerPointList.length === 1) {
            for (const pointIndex of outerPointList) {
                this.addInternalLine(pointIndex, innerPointList[0], 0);
            }
        } else if (innerPointList.length === 2) {
            const baseTrianglePointList = this.normalizeTriangle([outerPointList[0], innerPointList[0], innerPointList[1]]);
            this.addInternalLine(baseTrianglePointList[0], baseTrianglePointList[1], 0);
            this.addInternalLine(baseTrianglePointList[1], baseTrianglePointList[2], 0);
            this.addInternalLine(baseTrianglePointList[2], baseTrianglePointList[0], 0);
            for (let i = 1, j = 1; i < outerPointList.length; i++) {
                const range = this.tangentRange(baseTrianglePointList, outerPointList[i], [j, 2]);
                if (range[0] === range[1]) {
                    this.addInternalLine(outerPointList[i], baseTrianglePointList[j], 0);
                } else {
                    this.addInternalLine(outerPointList[i], baseTrianglePointList[j], 0);
                    this.addInternalLine(outerPointList[i], baseTrianglePointList[j + 1], 0);
                    j += 1;
                }
            }
        } else {
            const range = this.tangentRange(innerPointList, outerPointList[0]);
            if (range[0] < range[1]) {
                for (let j = range[0]; j <= range[1]; j++) {
                    this.addInternalLine(outerPointList[0], innerPointList[j], 0);
                }
            } else {
                for (let j = range[0]; j <= range[1] + innerPointList.length; j++) {
                    this.addInternalLine(outerPointList[0], innerPointList[j % innerPointList.length], 0);
                }
            }

            const scope = [range[1], range[0]];
            for (let i = 1; i < outerPointList.length; i++) {
                const range = this.tangentRange(innerPointList, outerPointList[i], scope);
                if (range[0] === range[1]) {
                    this.addInternalLine(outerPointList[i], innerPointList[scope[0]], 0);
                } else {
                    if (range[0] < range[1]) {
                        for (let j = range[0]; j <= range[1]; j++) {
                            this.addInternalLine(outerPointList[i], innerPointList[j], 0);
                        }
                    } else {
                        for (let j = range[0]; j <= range[1] + innerPointList.length; j++) {
                            this.addInternalLine(outerPointList[i], innerPointList[j % innerPointList.length], 0);
                        }
                    }
                    scope[0] = range[1];
                }
            }
        }
    }

    buildConnectionSchemeInternal(pointList) {
        const [outerPolygonPointList, restPointList] = this.findBoundingPolygon(pointList);
        if (restPointList.length >= 3) {
            const innerPolygonPointList = this.buildConnectionSchemeInternal(restPointList);
            this.connectPolygons(outerPolygonPointList, innerPolygonPointList);
        } else {
            this.connectPolygons(outerPolygonPointList, restPointList);
        }

        return outerPolygonPointList;
    }

    buildConnectionScheme() {
        this.buildConnectionSchemeInternal([...this._points.keys()]);
        const internalLineList = [...this._internalLineList];
        const internalLineTotalLength = this.totalLength(internalLineList);
        return [
            [...this._boundingLineList],
            internalLineList,
            internalLineTotalLength
        ];
    }

    selectAdjacentPointPair(line) {
        const commonAdjacentPointList = [...this._adjacencyList[line[1]]].filter(i => this._adjacencyList[line[2]].has(i));
        const pointList = [line[2], ...commonAdjacentPointList];
        pointList.sort((a, b) => this.anticlockwise(line[1], a, b));
        const pos = pointList.indexOf(line[2]);
        return [pointList[(pos + pointList.length - 1) % pointList.length], pointList[(pos + 1) % pointList.length]];
    }

    fineTune() {
        const lineQueue = [...this._internalLineList.values()].map(i => [i, this._lines.get(i)]).map(i => [i[0], i[1][0], i[1][1]]);
        const lineQueueIndexSet = new Set(this._internalLineList);
        const replacementLog = [];

        while (lineQueue.length !== 0) {
            const line = lineQueue.shift();
            lineQueueIndexSet.delete(line[0]);

            const adjacentPointPair = this.selectAdjacentPointPair(line);
            if (!this.intersectant(line[1], line[2], adjacentPointPair[0], adjacentPointPair[1])) {
                continue;
            }

            const diagonalLine = [this.lineIndexFromEndpointIndex(...adjacentPointPair), ...adjacentPointPair];

            const lineLength = this.distance(line[1], line[2]);
            const diagonalLineLength = this.distance(diagonalLine[1], diagonalLine[2]);

            if (lineLength <= diagonalLineLength) {
                continue;
            }

            this.deleteInternalLine(line[1], line[2]);
            this.addInternalLine(diagonalLine[1], diagonalLine[2]);
            replacementLog.push([line[0], diagonalLine[0], diagonalLineLength - lineLength]);

            //add influenced lines
            const influencedLines = [
                [line[1], diagonalLine[1]],
                [line[1], diagonalLine[2]],
                [line[2], diagonalLine[1]],
                [line[2], diagonalLine[2]]
            ].map(i => [this.lineIndexFromEndpointIndex(...i), ...i]);

            for (const influencedLine of influencedLines) {
                if (this._boundingLineList.has(influencedLine[0]) || lineQueueIndexSet.has(influencedLine[0])) {
                    continue;
                }

                lineQueue.push(influencedLine);
                lineQueueIndexSet.add(influencedLine[0]);
            }
        }

        const internalLineList = [...this._internalLineList];
        const internalLineTotalLength = this.totalLength(internalLineList);

        return [
            replacementLog,
            internalLineList,
            internalLineTotalLength];
    }

    shuffle() {
        const lineQueue = [...this._internalLineList.values()].map(i => [i, this._lines.get(i)]).map(i => [i[0], i[1][0], i[1][1]]);
        const replacementLog = [];

        for (let k = 0; k < this._internalLineList.size;) {
            const randomIndex = this._randomNumberPool.next() % lineQueue.length;
            const line = lineQueue.splice(randomIndex, 1)[0];

            const adjacentPointPair = this.selectAdjacentPointPair(line);
            if (!this.intersectant(line[1], line[2], adjacentPointPair[0], adjacentPointPair[1])) {
                continue;
            }

            const diagonalLine = [this.lineIndexFromEndpointIndex(...adjacentPointPair), ...adjacentPointPair];

            const lineLength = this.distance(line[1], line[2]);
            const diagonalLineLength = this.distance(diagonalLine[1], diagonalLine[2]);

            this.deleteInternalLine(line[1], line[2]);
            this.addInternalLine(diagonalLine[1], diagonalLine[2]);
            replacementLog.push([line[0], diagonalLine[0], diagonalLineLength - lineLength]);

            lineQueue.push(diagonalLine);

            k++;
        }

        const internalLineList = [...this._internalLineList];
        const internalLineTotalLength = this.totalLength(internalLineList);

        return [
            replacementLog,
            internalLineList,
            internalLineTotalLength];
    }

    points() {
        return [...this._points];
    }

    getLine(lineIndex) {
        const pointList = this._lines.get(lineIndex);
        return pointList.map(i => this._points[i]);
    }
}

class AnimationLine extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            startTimestamp: NaN,
            scale: 0.0
        };
        this.animateFrame = this.animateFrame.bind(this);
    }

    componentDidMount() {
        this.rafId = requestAnimationFrame(this.animateFrame);
    }

    componentWillUnmount() {
        cancelAnimationFrame(this.rafId);
    }

    animateFrame(time) {
        if (isNaN(this.state.startTimestamp)) {
            this.setState({
                startTimestamp: time
            }, () => {
                this.rafId = requestAnimationFrame(this.animateFrame);
            });
        } else {
            const timeElapsed = time - this.state.startTimestamp;
            const scale = Math.max(0.0, (timeElapsed - this.props.quiescentTime) / this.props.animatingTime);
            if (scale < 1.0) {
                this.setState({ scale }, () => {
                    this.rafId = requestAnimationFrame(this.animateFrame);
                });
            } else {
                this.props.stop();
            }
        }
    }

    render() {
        return <line
            x1={this.props.x1 * (1.0 - this.state.scale) + this.props.x3 * this.state.scale}
            y1={this.props.y1 * (1.0 - this.state.scale) + this.props.y3 * this.state.scale}
            x2={this.props.x2 * (1.0 - this.state.scale) + this.props.x4 * this.state.scale}
            y2={this.props.y2 * (1.0 - this.state.scale) + this.props.y4 * this.state.scale}
            stroke={this.props.stroke}
            strokeWidth={this.props.strokeWidth} />
    }
}

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            pointNumber: 9,
            points: [],
            boundingLineList: [],
            internalLineList: new Set(),
            internalLineTotalLength: 0.0,
            connectionSchemeRecords: [],
            activeRecordIndex: -1,
            replaying: false,
            replacementLog: [],
            currentReplayRow: 0,
            replayAnimationDuration: 1000,
            showPoint: true,
            showReplay: true,
            showLabel: false
        };
        this.handlePointNumberChange = this.handlePointNumberChange.bind(this);
        this.handlePointNumberSubmit = this.handlePointNumberSubmit.bind(this);
        this.handleShowPointChange = this.handleShowPointChange.bind(this);
        this.handleShowReplayChange = this.handleShowReplayChange.bind(this);
        this.handleShowLabelChange = this.handleShowLabelChange.bind(this);
        this.handleFineTune = this.handleFineTune.bind(this);
        this.handleShuffle = this.handleShuffle.bind(this);
        this.handleAnimationStop = this.handleAnimationStop.bind(this);
        this.handleAnimationSpeedUp = this.handleAnimationSpeedUp.bind(this);
        this.handleAnimationSpeedDown = this.handleAnimationSpeedDown.bind(this);
        this.handleRecordShow = this.handleRecordShow.bind(this);
        this.handleRecordDelete = this.handleRecordDelete.bind(this);
    }

    setupMesh(points, boundingLineList, callback) {
        this.setState({
            points,
            boundingLineList,
            internalLineList: new Set(),
            internalLineTotalLength: 0.0,
            connectionSchemeRecords: [],
            activeRecordIndex: -1,
            replaying: false
        }, callback);
    }

    showConnectionScheme(internalLineList, internalLineTotalLength) {
        this.setState(state => {
            state.replaying = false;
            state.internalLineList = new Set(internalLineList);
            state.internalLineTotalLength = internalLineTotalLength;
            state.connectionSchemeRecords.push({
                internalLineList,
                internalLineTotalLength,
                visible: true
            });
            state.activeRecordIndex = state.connectionSchemeRecords.length - 1;
            return state;
        });
    }

    showConnectionSchemeWithReplay(replacementLog, internalLineList, internalLineTotalLength) {
        this.setState(state => {
            if (state.showReplay && replacementLog.length !== 0) {
                if (state.activeRecordIndex !== state.connectionSchemeRecords.length - 1) {
                    const record = state.connectionSchemeRecords[state.connectionSchemeRecords.length - 1];
                    state.internalLineList = new Set(record.internalLineList);
                    state.internalLineTotalLength = record.internalLineTotalLength;
                }
                state.replaying = true;
            } else {
                state.internalLineList = new Set(internalLineList);
                state.internalLineTotalLength = internalLineTotalLength;
            }
            state.replacementLog = replacementLog;
            state.currentReplayRow = 0;
            state.connectionSchemeRecords.push({
                internalLineList,
                internalLineTotalLength,
                visible: true
            });
            state.activeRecordIndex = state.connectionSchemeRecords.length - 1;
            return state;
        });
    }

    handleAnimationStop() {
        this.setState(state => {
            if (!state.showReplay) {
                state.replaying = false;
            }
            if (state.replaying) {
                const replacementLogRow = state.replacementLog[state.currentReplayRow];
                state.internalLineList.delete(replacementLogRow[0]);
                state.internalLineList.add(replacementLogRow[1]);
                state.internalLineTotalLength += replacementLogRow[2];
                state.currentReplayRow += 1;
                if (state.currentReplayRow === state.replacementLog.length) {
                    state.replaying = false;
                }
            }
            if (!state.replaying) {
                const record = state.connectionSchemeRecords[state.connectionSchemeRecords.length - 1];
                state.internalLineList = new Set(record.internalLineList);
                state.internalLineTotalLength = record.internalLineTotalLength;
            }
            return state;
        });
    }

    handlePointNumberChange(e) {
        if (e.target.value >= 0 && e.target.value <= 1024) {
            this.setState({
                pointNumber: e.target.value
            });
        }
    }

    handlePointNumberSubmit() {
        console.clear();
        this.network = new Network(this.props.width, this.props.height, this.state.pointNumber);
        const [boundingLineList, internalLineList, internalLineTotalLength] = this.network.buildConnectionScheme();
        this.setupMesh(this.network.points(), boundingLineList, () => {
            this.showConnectionScheme(internalLineList, internalLineTotalLength);
        });
    }

    handleShowPointChange(e) {
        this.setState({ showPoint: e.target.checked });
    }

    handleShowReplayChange(e) {
        this.setState({ showReplay: e.target.checked });
    }

    handleShowLabelChange(e) {
        this.setState({ showLabel: e.target.checked });
    }

    handleFineTune() {
        const [replacementLog, internalLineList, internalLineTotalLength] = this.network.fineTune();
        this.showConnectionSchemeWithReplay(
            replacementLog,
            internalLineList,
            internalLineTotalLength);
    }

    handleShuffle() {
        const [replacementLog, internalLineList, internalLineTotalLength] = this.network.shuffle();
        this.showConnectionSchemeWithReplay(
            replacementLog,
            internalLineList,
            internalLineTotalLength);
    }

    handleRecordShow(e) {
        const index = parseInt(e.target.dataset.tag);
        this.setState(state => {
            const record = state.connectionSchemeRecords[index];
            state.replaying = false;
            state.internalLineList = new Set(record.internalLineList);
            state.internalLineTotalLength = record.internalLineTotalLength;
            state.activeRecordIndex = index;
            return state;
        });
    }

    handleRecordDelete(e) {
        const index = parseInt(e.target.dataset.tag);
        this.setState(state => {
            state.connectionSchemeRecords[index].visible = false;
            return state;
        });
    }

    handleAnimationSpeedUp() {
        this.setState(state => {
            if (state.replayAnimationDuration > 100) {
                state.replayAnimationDuration *= 0.8;
            }
            return state;
        });
    }

    handleAnimationSpeedDown() {
        this.setState(state => {
            if (state.replayAnimationDuration < 4000) {
                state.replayAnimationDuration *= 1.25;
            }
            return state;
        });
    }

    componentDidMount() {
        this.handlePointNumberSubmit();
    }

    renderBoundingLines() {
        return this.state.boundingLineList.map(lineIndex => {
            const line = this.network.getLine(lineIndex);
            return <React.Fragment key={lineIndex}>
                <line x1={line[0].x} y1={this.props.height - line[0].y} x2={line[1].x} y2={this.props.height - line[1].y} stroke="black" strokeWidth="1.5" />
            </React.Fragment>;
        });
    }

    renderInternalLines() {
        return [...this.state.internalLineList]
            .map(lineIndex => {
                const line = this.network.getLine(lineIndex);
                return <React.Fragment key={lineIndex}>
                    <line x1={line[0].x} y1={this.props.height - line[0].y} x2={line[1].x} y2={this.props.height - line[1].y} stroke="silver" strokeWidth="1.5" />
                    {this.state.showLabel && <text x={(line[0].x + line[1].x) / 2} y={this.props.height - (line[0].y + line[1].y) / 2} stroke="blue" fill="white">{lineIndex}</text>}
                </React.Fragment>;
            });
    }

    renderReplacementAnimation() {
        if (this.state.replaying) {
            const oldLine = this.network.getLine(this.state.replacementLog[this.state.currentReplayRow][0]);
            const newLine = this.network.getLine(this.state.replacementLog[this.state.currentReplayRow][1]);
            return <React.Fragment>
                <polygon
                    points={`${oldLine[0].x},${this.props.height - oldLine[0].y} ${newLine[0].x},${this.props.height - newLine[0].y} ${oldLine[1].x},${this.props.height - oldLine[1].y} ${newLine[1].x},${this.props.height - newLine[1].y}`}
                    fill="lightyellow" stroke="grey" strokeWidth="1.5" />
                <AnimationLine key={this.state.currentReplayRow}
                    x1={oldLine[0].x} y1={this.props.height - oldLine[0].y}
                    x2={oldLine[1].x} y2={this.props.height - oldLine[1].y}
                    x3={newLine[0].x} y3={this.props.height - newLine[0].y}
                    x4={newLine[1].x} y4={this.props.height - newLine[1].y}
                    quiescentTime={this.state.replayAnimationDuration * 0.2} animatingTime={this.state.replayAnimationDuration * 0.8}
                    stroke="silver" strokeWidth="2"
                    stop={this.handleAnimationStop} />
            </React.Fragment>;
        }
    }

    renderPoints() {
        return this.state.points.map((point, pointIndex) => <React.Fragment key={pointIndex}>
            <circle cx={point.x} cy={this.props.height - point.y} r="3" fill="red" />
            {this.state.showLabel && <text x={point.x} y={this.props.height - point.y} stroke="brown" fill="white">{pointIndex}</text>}
        </React.Fragment>);
    }

    render() {
        return <React.Fragment>
            <div>
                <p>
                    <span>Vertex number: <input type="number" value={this.state.pointNumber} onChange={this.handlePointNumberChange} /> <button onClick={this.handlePointNumberSubmit}>Create mesh</button></span>
                    <span>,&nbsp;&nbsp;</span>
                    <span>Edge number: {this.state.boundingLineList.length + this.state.internalLineList.size}</span>
                    <span>,&nbsp;&nbsp;</span>
                    <span>Edge total length: {this.state.internalLineTotalLength.toFixed(2)}</span>
                    <span>,&nbsp;&nbsp;</span>
                    <span>Triangle number: {(this.state.boundingLineList.length + this.state.internalLineList.size * 2) / 3}</span>
                </p>
                <p>
                    <span><label>Show replays: <input type="checkbox" checked={this.state.showReplay} onChange={this.handleShowReplayChange} /></label></span>
                    <span>,&nbsp;&nbsp;</span>
                    <span><label>Show points: <input type="checkbox" checked={this.state.showPoint} onChange={this.handleShowPointChange} /></label></span>
                    <span>,&nbsp;&nbsp;</span>
                    <span><label>Show labels: <input type="checkbox" checked={this.state.showLabel} onChange={this.handleShowLabelChange} /></label></span>
                </p>
                <p>
                    <span><button onClick={this.handleFineTune} disabled={this.state.replaying}>Fine tune</button></span>
                    <span>&nbsp;&nbsp;</span>
                    <span><button onClick={this.handleShuffle} disabled={this.state.replaying}>Shuffle</button></span>
                    <span>&nbsp;&nbsp;</span>
                    {this.state.replaying && <React.Fragment>
                        <span>,&nbsp;&nbsp;</span>
                        <span>Steps: {this.state.currentReplayRow}/{this.state.replacementLog.length}</span>
                        <span>,&nbsp;&nbsp;</span>
                        <span>Animation speed: <button onClick={this.handleAnimationSpeedUp}>+</button>&nbsp;<button onClick={this.handleAnimationSpeedDown}>-</button></span>
                    </React.Fragment>}
                </p>
            </div>
            <div className="container">
                <svg width={this.props.width} height={this.props.height} xmlns="http://www.w3.org/2000/svg">
                    <g>
                        {this.renderInternalLines()}
                        {this.renderReplacementAnimation()}
                        {this.renderBoundingLines()}
                        {this.state.showPoint && this.renderPoints()};
                </g>
                </svg>
                <div>
                    <p>Records:</p>
                    {this.state.connectionSchemeRecords.map((item, index) => item.visible && <div key={index}>
                        <span>&nbsp;&nbsp;</span>
                        {this.state.activeRecordIndex === index ?
                            <span>#{index.toString().padStart(5, '0')}</span> :
                            <a href="#" onClick={this.handleRecordShow} data-tag={index}>#{index.toString().padStart(5, '0')}</a>}
                        <span>&nbsp;(total length: {item.internalLineTotalLength.toFixed(2)})</span>
                        <span>&nbsp;&nbsp;</span>
                        {this.state.activeRecordIndex !== index && <button onClick={this.handleRecordDelete} data-tag={index}>X</button>}
                    </div>)}
                </div>
            </div>
        </React.Fragment>;
    }
}

ReactDOM.render(<App width={800} height={800} />, document.querySelector('#root'));