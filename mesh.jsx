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
        this.randomNumberPool = new RandomNumberPool();
        this.points = this.generatePoints(width, height, pointNumber);
        this.lines = new Map();
        this.boundingLineList = new Set();
        this.internalLineList = new Set();
        this.adjacencyList = Array.from({ length: pointNumber }, () => new Set());
    }

    distance(index1, index2) {
        return distance(this.points[index1], this.points[index2]);
    }

    anticlockwise(index1, index2, index3) {
        return anticlockwise(this.points[index1], this.points[index2], this.points[index3]);
    }

    intersectant(index1, index2, index3, index4) {
        return intersectant(this.points[index1], this.points[index2], this.points[index3], this.points[index4]);
    }

    lineIndexFromEndpointIndex(index1, index2) {
        return (index1 + index2) * (index1 + index2 + 1) / 2 + Math.min(index1, index2);
    }

    addBoundingLine(pointIndex1, pointIndex2) {
        const lineIndex = this.lineIndexFromEndpointIndex(pointIndex1, pointIndex2);
        this.lines.set(lineIndex, [pointIndex1, pointIndex2]);
        this.boundingLineList.add(lineIndex);
        this.adjacencyList[pointIndex1].add(pointIndex2);
        this.adjacencyList[pointIndex2].add(pointIndex1);
    }

    addInternalLine(pointIndex1, pointIndex2) {
        const lineIndex = this.lineIndexFromEndpointIndex(pointIndex1, pointIndex2);
        this.lines.set(lineIndex, [pointIndex1, pointIndex2]);
        this.internalLineList.add(lineIndex);
        this.adjacencyList[pointIndex1].add(pointIndex2);
        this.adjacencyList[pointIndex2].add(pointIndex1);
    }

    deleteInternalLine(pointIndex1, pointIndex2) {
        const lineIndex = this.lineIndexFromEndpointIndex(pointIndex1, pointIndex2);
        this.internalLineList.delete(lineIndex);
        this.adjacencyList[pointIndex1].delete(pointIndex2);
        this.adjacencyList[pointIndex2].delete(pointIndex1);
    }
    
    generatePoints(width, height, pointNumber) {
        const center = { x: width / 2, y: height / 2 };
        const radius2 = Math.pow(Math.min(width / 2, height / 2), 2);

        const points = [];
        while (points.length < pointNumber) {
            const point = {
                x: this.randomNumberPool.next() % width,
                y: this.randomNumberPool.next() % height
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
        const bounding = pointList.length === this.points.length;
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

    buildMesh(pointList = [...this.points.keys()]) {
        const [outerPolygonPointList, restPointList] = this.findBoundingPolygon(pointList);
        if (restPointList.length >= 3) {
            const innerPolygonPointList = this.buildMesh(restPointList);
            this.connectPolygons(outerPolygonPointList, innerPolygonPointList);
        } else {
            this.connectPolygons(outerPolygonPointList, restPointList);
        }

        return outerPolygonPointList;
    }

    selectAdjacentPointPair(line) {
        const commonAdjacentPointList = [...this.adjacencyList[line[1]]].filter(i => this.adjacencyList[line[2]].has(i));
        const pointList = [line[2], ...commonAdjacentPointList];
        pointList.sort((a, b) => this.anticlockwise(line[1], a, b));
        const pos = pointList.indexOf(line[2]);
        return [pointList[(pos + pointList.length - 1) % pointList.length], pointList[(pos + 1) % pointList.length]];
    }

    fineTune() {
        const lineQueue = [...this.internalLineList.values()].map(i => [i, this.lines.get(i)]).map(i => [i[0], i[1][0], i[1][1]]);
        const lineQueueIndexSet = new Set(this.internalLineList);
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
                if (this.boundingLineList.has(influencedLine[0]) || lineQueueIndexSet.has(influencedLine[0])) {
                    continue;
                }

                lineQueue.push(influencedLine);
                lineQueueIndexSet.add(influencedLine[0]);
            }
        }

        return replacementLog;
    }

    shuffle() {
        const lineQueue = [...this.internalLineList.values()].map(i => [i, this.lines.get(i)]).map(i => [i[0], i[1][0], i[1][1]]);
        const replacementLog = [];

        for (let k = 0; k < this.internalLineList.size;) {
            const randomIndex = this.randomNumberPool.next() % lineQueue.length;
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

        return replacementLog;
    }

    getLine(lineIndex) {
        const pointList = this.lines.get(lineIndex);
        return pointList.map(i => this.points[i]);
    }

    totalLength() {
        return [...this.internalLineList].reduce((length, lineIndex) => {
            const line = this.lines.get(lineIndex);
            return length + this.distance(line[0], line[1]);
        }, 0.0);
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
            fineTuneSteps: 0,
            points: [],
            boundingLineList: [],
            internalLineList: new Set(),
            fineTuning: false,
            replacementLog: [],
            currentReplacementRow: 0,
            totalLength: 0.0,
            animationDuration: 1000,
            showPoint: true,
            showLabel: false
        };
        this.handlePointNumberChange = this.handlePointNumberChange.bind(this);
        this.handlePointNumberSubmit = this.handlePointNumberSubmit.bind(this);
        this.handleShowPointChange = this.handleShowPointChange.bind(this);
        this.handleShowLabelChange = this.handleShowLabelChange.bind(this);
        this.handleFineTune = this.handleFineTune.bind(this);
        this.handleShuffle = this.handleShuffle.bind(this);
        this.handleAnimationStop = this.handleAnimationStop.bind(this);
        this.handleAnimationSpeedUp = this.handleAnimationSpeedUp.bind(this);
        this.handleAnimationSpeedDown = this.handleAnimationSpeedDown.bind(this);
    }

    showNetwork() {
        this.network = new Network(this.props.width, this.props.height, this.state.pointNumber);
        this.network.buildMesh();
        this.setState({
            points: this.network.points,
            boundingLineList: [...this.network.boundingLineList],
            internalLineList: new Set(this.network.internalLineList),
            totalLength: this.network.totalLength(),
            fineTuning: false
        });
    }

    showNextReplacement() {
        this.setState(state => {
            const replacementLogRow = state.replacementLog[state.currentReplacementRow];
            state.internalLineList.delete(replacementLogRow[0]);
            state.internalLineList.add(replacementLogRow[1]);
            state.totalLength += replacementLogRow[2];
            state.currentReplacementRow += 1;
            if (state.currentReplacementRow === state.replacementLog.length) {
                state.fineTuning = false;
            }
            return state;
        });
    }

    handleAnimationStop() {
        this.showNextReplacement();
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

        this.showNetwork();
    }

    handleShowPointChange(e) {
        this.setState({ showPoint: e.target.checked });
    }

    handleShowLabelChange(e) {
        this.setState({ showLabel: e.target.checked });
    }

    handleFineTune() {
        const replacementLog = this.network.fineTune();
        this.setState({
            fineTuning: replacementLog.length !== 0,
            replacementLog,
            currentReplacementRow: 0
        });
    }

    handleShuffle() {
        const replacementLog = this.network.shuffle();
        this.setState({
            fineTuning: replacementLog.length !== 0,
            replacementLog,
            currentReplacementRow: 0
        });
    }

    handleAnimationSpeedUp() {
        this.setState(state => {
            if (state.animationDuration > 100) {
                state.animationDuration *= 0.8;
            }
            return state;
        });
    }

    handleAnimationSpeedDown() {
        this.setState(state => {
            if (state.animationDuration < 4000) {
                state.animationDuration *= 1.25;
            }
            return state;
        });
    }

    componentDidMount() {
        this.showNetwork();
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
        if (this.state.fineTuning && this.state.currentReplacementRow >= 0 && this.state.currentReplacementRow < this.state.replacementLog.length) {
            const oldLine = this.network.getLine(this.state.replacementLog[this.state.currentReplacementRow][0]);
            const newLine = this.network.getLine(this.state.replacementLog[this.state.currentReplacementRow][1]);
            return <React.Fragment>
                <polygon
                    points={`${oldLine[0].x},${this.props.height - oldLine[0].y} ${newLine[0].x},${this.props.height - newLine[0].y} ${oldLine[1].x},${this.props.height - oldLine[1].y} ${newLine[1].x},${this.props.height - newLine[1].y}`}
                    fill="lightyellow" stroke="grey" strokeWidth="1.5" />
                <AnimationLine key={-this.state.currentReplacementRow}
                    x1={oldLine[0].x} y1={this.props.height - oldLine[0].y}
                    x2={oldLine[1].x} y2={this.props.height - oldLine[1].y}
                    x3={newLine[0].x} y3={this.props.height - newLine[0].y}
                    x4={newLine[1].x} y4={this.props.height - newLine[1].y}
                    quiescentTime={this.state.animationDuration * 0.2} animatingTime={this.state.animationDuration * 0.8}
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
                    <span>Point number: <input type="number" value={this.state.pointNumber} onChange={this.handlePointNumberChange} /> <button onClick={this.handlePointNumberSubmit}>Create network</button></span>
                    <span>,&nbsp;&nbsp;</span>
                    <span>Edge number: {this.state.boundingLineList.length + this.state.internalLineList.size}</span>
                    <span>,&nbsp;&nbsp;</span>
                    <span>Triangle number: {(this.state.boundingLineList.length + this.state.internalLineList.size * 2) / 3}</span>
                    <span>,&nbsp;&nbsp;</span>
                    <span><label>Show points: <input type="checkbox" checked={this.state.showPoint} onChange={this.handleShowPointChange} /></label></span>
                    <span>,&nbsp;&nbsp;</span>
                    <span><label>Show labels: <input type="checkbox" checked={this.state.showLabel} onChange={this.handleShowLabelChange} /></label></span>
                </p>
                <p>
                    <span><button onClick={this.handleFineTune} disabled={this.state.fineTuning}>Fine tune</button></span>
                    <span>,&nbsp;&nbsp;</span>
                    <span><button onClick={this.handleShuffle} disabled={this.state.fineTuning}>Shuffle</button></span>
                    <React.Fragment>
                        <span>,&nbsp;&nbsp;</span>
                        <span>Steps: {this.state.currentReplacementRow}/{this.state.replacementLog.length}</span>
                        <span>,&nbsp;&nbsp;</span>
                        <span>Total length: {this.state.totalLength.toFixed(2)}</span>
                        {this.state.fineTuning && <React.Fragment>
                            <span>,&nbsp;&nbsp;</span>
                            <span>Animation speed: <button onClick={this.handleAnimationSpeedUp}>+</button>&nbsp;<button onClick={this.handleAnimationSpeedDown}>-</button></span>
                        </React.Fragment>}
                    </React.Fragment>
                </p>
            </div>
            <svg width={this.props.width} height={this.props.height} xmlns="http://www.w3.org/2000/svg">
                <g>
                    {this.renderInternalLines()}
                    {this.renderReplacementAnimation()}
                    {this.renderBoundingLines()}
                    {this.state.showPoint && this.renderPoints()};
                </g>
            </svg>
        </React.Fragment>;
    }
}

ReactDOM.render(<App width={800} height={800} />, document.querySelector('#root'));