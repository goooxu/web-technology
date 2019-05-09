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
    constructor(points) {
        this.points = points;
        this.lines = new Map();
        this.boundingLineList = new Set();
        this.internalLineList = new Set();
        this.adjacencyList = Array.from({ length: points.length }, () => new Set());
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

    normalizeTriangle(trianglePointList) {
        if (this.anticlockwise(
            trianglePointList[0],
            trianglePointList[1],
            trianglePointList[2]
        ) !== 1) {
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

        lineQueue.sort((a, b) => this.distance(b[1], b[2]) - this.distance(a[1], a[2]));

        while (lineQueue.length !== 0) {
            const line = lineQueue.shift();
            lineQueueIndexSet.delete(line[0]);

            const adjacentPointPair = this.selectAdjacentPointPair(line);
            if (!this.intersectant(line[1], line[2], adjacentPointPair[0], adjacentPointPair[1])) {
                continue;
            }

            const diagonalLine = [this.lineIndexFromEndpointIndex(adjacentPointPair[0], adjacentPointPair[1]), ...adjacentPointPair];

            const lineLength = this.distance(line[1], line[2]);
            const diagonalLineLength = this.distance(diagonalLine[1], diagonalLine[2]);

            if (lineLength <= diagonalLineLength) {
                continue;
            }

            this.deleteInternalLine(line[1], line[2]);
            this.addInternalLine(diagonalLine[1], diagonalLine[2]);
            lineQueueIndexSet.delete(line[0]);
            replacementLog.push([line[0], diagonalLine[0]]);

            //add influenced lines
            const influencedLines = [
                [line[1], diagonalLine[1]],
                [line[1], diagonalLine[2]],
                [line[2], diagonalLine[1]],
                [line[2], diagonalLine[2]]
            ].map(i => [this.lineIndexFromEndpointIndex(i[0], i[1]), ...i]);

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

    build() {
        let outerBoundingPolygonPointList;
        let restPointList = [...Array(this.points.length).keys()];
        do {
            let boundingPolygonPointList;
            [boundingPolygonPointList, restPointList] = this.findBoundingPolygon(restPointList);
            if (outerBoundingPolygonPointList) {
                this.connectPolygons(outerBoundingPolygonPointList, boundingPolygonPointList);
            }
            outerBoundingPolygonPointList = boundingPolygonPointList;
        } while (restPointList.length !== 0);
        this.connectPolygons(outerBoundingPolygonPointList, []);
        this.totalLength = [...this.internalLineList].reduce((length, lineIndex) => {
            const line = this.lines.get(lineIndex);
            return length + this.distance(line[0], line[1]);
        }, 0.0);
    }

    getLine(lineIndex) {
        return this.lines.get(lineIndex);
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
            showIndex: false
        };
        this.randomNumberPool = new RandomNumberPool();
        this.handlePointNumberChange = this.handlePointNumberChange.bind(this);
        this.handlePointNumberSubmit = this.handlePointNumberSubmit.bind(this);
        this.handleShowIndexChange = this.handleShowIndexChange.bind(this);
        this.handleFineTune = this.handleFineTune.bind(this);
        this.handleAnimationStop = this.handleAnimationStop.bind(this);
        this.handleAnimationSpeedUp = this.handleAnimationSpeedUp.bind(this);
        this.handleAnimationSpeedDown = this.handleAnimationSpeedDown.bind(this);
    }

    createNetwork() {
        const center = {
            x: this.props.width / 2,
            y: this.props.height / 2
        };
        const radius = Math.min(this.props.width / 2, this.props.height / 2);

        const points = [];
        while (points.length < this.state.pointNumber) {
            const point = {
                x: this.randomNumberPool.next() % this.props.width,
                y: this.randomNumberPool.next() % this.props.height
            };
            if ((point.x - center.x) * (point.x - center.x) + (point.y - center.y) * (point.y - center.y) < radius * radius) {
                points.push(point);
            }
        }
        const network = new Network(points);
        network.build();
        return network;
    }

    showNetwork() {
        this.network = this.createNetwork();
        this.setState({
            points: this.network.points,
            boundingLineList: [...this.network.boundingLineList],
            internalLineList: new Set(this.network.internalLineList),
            fineTuning: false
        });
    }

    showNextReplacement() {
        this.setState(state => {
            const replacementPair = state.replacementLog[state.currentReplacementRow];
            state.internalLineList.delete(replacementPair[0]);
            state.internalLineList.add(replacementPair[1]);
            const oldLine = this.network.getLine(replacementPair[0]);
            const newLine = this.network.getLine(replacementPair[1]);
            state.totalLength = state.totalLength - distance(state.points[oldLine[0]], state.points[oldLine[1]]) + distance(state.points[newLine[0]], state.points[newLine[1]]);
            state.currentReplacementRow += 1;
            return state;
        });
    }

    showFineTuneAnimation() {
        const replacementLog = this.network.fineTune();
        this.setState({
            fineTuning: true,
            replacementLog,
            currentReplacementRow: 0,
            totalLength: this.network.totalLength
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

    handleShowIndexChange(e) {
        this.setState({
            showIndex: e.target.checked
        });
    }

    handleFineTune() {
        this.showFineTuneAnimation();
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
            const point1 = this.state.points[line[0]];
            const point2 = this.state.points[line[1]];
            return <React.Fragment key={lineIndex}>
                <line x1={point1.x} y1={this.props.height - point1.y} x2={point2.x} y2={this.props.height - point2.y} stroke="black" strokeWidth="1.5" />
            </React.Fragment>;
        });
    }

    renderInternalLines() {
        return [...this.state.internalLineList]
            .map(lineIndex => {
                const line = this.network.getLine(lineIndex);
                const point1 = this.state.points[line[0]];
                const point2 = this.state.points[line[1]];
                return <React.Fragment key={lineIndex}>
                    <line x1={point1.x} y1={this.props.height - point1.y} x2={point2.x} y2={this.props.height - point2.y} stroke="silver" strokeWidth="1.5" />
                    {this.state.showIndex && <text x={(point1.x + point2.x) / 2} y={this.props.height - (point1.y + point2.y) / 2} stroke="blue" fill="white">{lineIndex}</text>}
                </React.Fragment>;
            });
    }

    renderReplacementAnimation() {
        if (this.state.fineTuning && this.state.currentReplacementRow >= 0 && this.state.currentReplacementRow < this.state.replacementLog.length) {
            const oldLine = this.network.getLine(this.state.replacementLog[this.state.currentReplacementRow][0]);
            const newLine = this.network.getLine(this.state.replacementLog[this.state.currentReplacementRow][1]);
            const point1 = this.state.points[oldLine[0]];
            const point2 = this.state.points[oldLine[1]];
            const point3 = this.state.points[newLine[0]];
            const point4 = this.state.points[newLine[1]];
            return <React.Fragment>
                <polygon
                    points={`${point1.x},${this.props.height - point1.y} ${point3.x},${this.props.height - point3.y} ${point2.x},${this.props.height - point2.y} ${point4.x},${this.props.height - point4.y}`}
                    fill="lightyellow" stroke="grey" strokeWidth="1.5" />
                <AnimationLine key={this.state.replacementLog[this.state.currentReplacementRow][1]}
                    x1={point1.x} y1={this.props.height - point1.y}
                    x2={point2.x} y2={this.props.height - point2.y}
                    x3={point3.x} y3={this.props.height - point3.y}
                    x4={point4.x} y4={this.props.height - point4.y}
                    quiescentTime={this.state.animationDuration * 0.2} animatingTime={this.state.animationDuration * 0.8}
                    stroke="silver" strokeWidth="2"
                    stop={this.handleAnimationStop} />
            </React.Fragment>;
        }
    }

    renderPoints() {
        return this.state.points.map((point, pointIndex) => <React.Fragment key={pointIndex}>
            <circle cx={point.x} cy={this.props.height - point.y} r="3" fill="red" />
            {this.state.showIndex && <text x={point.x} y={this.props.height - point.y} stroke="brown" fill="white">{pointIndex}</text>}
        </React.Fragment>);
    }

    render() {
        return <React.Fragment>
            <div>
                <p>
                    <span>Point number: <input type="number" value={this.state.pointNumber} onChange={this.handlePointNumberChange} /> <button onClick={this.handlePointNumberSubmit}>Create</button></span>
                    <span>,&nbsp;&nbsp;</span>
                    <span>Edge number: {this.state.boundingLineList.length + this.state.internalLineList.size}</span>
                    <span>,&nbsp;&nbsp;</span>
                    <span>Triangle number: {(this.state.boundingLineList.length + this.state.internalLineList.size * 2) / 3}</span>
                    <span>,&nbsp;&nbsp;</span>
                    <span><label>Show index: <input type="checkbox" checked={this.state.showIndex} onChange={this.handleShowIndexChange} /></label></span>
                </p>
                <p>
                    <span><button onClick={this.handleFineTune} disabled={this.state.fineTuning}>Fine tune</button></span>
                    {this.state.fineTuning && <React.Fragment>
                        <span>,&nbsp;&nbsp;</span>
                        <span>Fine tune steps: {this.state.currentReplacementRow}/{this.state.replacementLog.length}</span>
                        <span>,&nbsp;&nbsp;</span>
                        <span>Total length: {this.state.totalLength.toFixed(2)}</span>
                        <span>,&nbsp;&nbsp;</span>
                        <span>Animation speed: <button onClick={this.handleAnimationSpeedUp}>+</button>&nbsp;<button onClick={this.handleAnimationSpeedDown}>-</button></span>
                    </React.Fragment>}
                </p>
            </div>
            <svg width={this.props.width} height={this.props.height} xmlns="http://www.w3.org/2000/svg">
                <g>
                    {this.renderBoundingLines()}
                    {this.renderInternalLines()}
                    {this.renderReplacementAnimation()}
                    {this.renderPoints()};
                </g>
            </svg>
        </React.Fragment>;
    }
}

ReactDOM.render(<App width={800} height={800} />, document.querySelector('#root'));