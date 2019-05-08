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

function anticlockwise(p1, p2, p3) {
    return Math.sign((p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y));
}

class Network {
    constructor(points) {
        this.points = points;
        this.lines = [];
    }

    anticlockwise(index1, index2, index3) {
        return anticlockwise(this.points[index1], this.points[index2], this.points[index3]);
    }

    addLine(pointIndex1, pointIndex2) {
        const line = [this.points[pointIndex1], this.points[pointIndex2]];
        this.lines.push(line);
    }

    findRange(pointList, sourcePointIndex, restrictedRange) {
        if (!restrictedRange) {
            restrictedRange = [0, pointList.length];
        }
        let range = [restrictedRange[0], restrictedRange[0]];
        for (let i = restrictedRange[0]; i < (restrictedRange[0] > restrictedRange[1] ? restrictedRange[1] + pointList.length : restrictedRange[1]); i++) {
            if (this.anticlockwise(pointList[i % pointList.length], pointList[(i + 1) % pointList.length], sourcePointIndex) === -1) {
                if (range[0] === range[1]) {
                    range = [i, i + 1];
                } else if (range[1] === i) {
                    range[1] = i + 1;
                } else if (range[0] === restrictedRange[0]) {
                    range[0] = i;
                    range[1] = range[1] + pointList.length;
                }
            }
        }

        return [range[0] % pointList.length, range[1] % pointList.length];
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

    buildBoundingPolygon(pointList) {
        if (pointList.length < 3) {
            return [pointList, []];
        }
        const availablePointList = new Set(pointList);
        const boundingPolygonPointList = this.normalizeTriangle(pointList.splice(0, 3));
        while (pointList.length !== 0) {
            const pointIndex = pointList.shift();
            const range = this.findRange(boundingPolygonPointList, pointIndex);
            if (range[0] < range[1]) {
                boundingPolygonPointList.splice(range[0] + 1, range[1] - range[0] - 1, pointIndex);
            } else if (range[0] > range[1]) {
                boundingPolygonPointList.splice(range[0] + 1);
                boundingPolygonPointList.splice(0, range[1], pointIndex);
            }
        }
        for (let i = 0; i < boundingPolygonPointList.length; i++) {
            this.addLine(boundingPolygonPointList[i], boundingPolygonPointList[(i + 1) % boundingPolygonPointList.length]);
            availablePointList.delete(boundingPolygonPointList[i]);
        }
        return [boundingPolygonPointList, Array.from(availablePointList)];
    }

    connectBoundingPolygon(outerPointList, innerPointList) {
        if (innerPointList.length === 0) {
            if (outerPointList.length > 3) {
                for (let i = 2; i < outerPointList.length - 1; i++) {
                    this.addLine(outerPointList[0], outerPointList[i]);
                }
            }
        } else if (innerPointList.length === 1) {
            for (const pointIndex of outerPointList) {
                this.addLine(pointIndex, innerPointList[0]);
            }
        } else if (innerPointList.length === 2) {
            const baseTrianglePointList = this.normalizeTriangle([outerPointList[0], innerPointList[0], innerPointList[1]]);
            this.addLine(baseTrianglePointList[0], baseTrianglePointList[1]);
            this.addLine(baseTrianglePointList[1], baseTrianglePointList[2]);
            this.addLine(baseTrianglePointList[2], baseTrianglePointList[0]);
            for (let i = 1, j = 1; i < outerPointList.length; i++) {
                const range = this.findRange(baseTrianglePointList, outerPointList[i], [j, 2]);
                if (range[0] === range[1]) {
                    this.addLine(outerPointList[i], baseTrianglePointList[j]);
                } else {
                    this.addLine(outerPointList[i], baseTrianglePointList[j]);
                    this.addLine(outerPointList[i], baseTrianglePointList[j + 1]);
                    j += 1;
                }
            }
        } else {
            const range = this.findRange(innerPointList, outerPointList[0]);
            if (range[0] < range[1]) {
                for (let j = range[0]; j <= range[1]; j++) {
                    this.addLine(outerPointList[0], innerPointList[j]);
                }
            } else {
                for (let j = range[0]; j <= range[1] + innerPointList.length; j++) {
                    this.addLine(outerPointList[0], innerPointList[j % innerPointList.length]);
                }
            }

            const restrictedRange = [range[1], range[0]];
            for (let i = 1; i < outerPointList.length; i++) {
                const range = this.findRange(innerPointList, outerPointList[i], restrictedRange);
                if (range[0] === range[1]) {
                    this.addLine(outerPointList[i], innerPointList[restrictedRange[0]]);
                } else {
                    if (range[0] < range[1]) {
                        for (let j = range[0]; j <= range[1]; j++) {
                            this.addLine(outerPointList[i], innerPointList[j]);
                        }
                    } else {
                        for (let j = range[0]; j <= range[1] + innerPointList.length; j++) {
                            this.addLine(outerPointList[i], innerPointList[j % innerPointList.length]);
                        }
                    }
                    restrictedRange[0] = range[1];
                }
            }
        }
    }

    build() {
        let outerBoundingPolygonPointList;
        let restPointList = [...Array(this.points.length).keys()];
        do {
            let boundingPolygonPointList;
            [boundingPolygonPointList, restPointList] = this.buildBoundingPolygon(restPointList);
            if (outerBoundingPolygonPointList) {
                this.connectBoundingPolygon(outerBoundingPolygonPointList, boundingPolygonPointList);
            }
            outerBoundingPolygonPointList = boundingPolygonPointList;
        } while (restPointList.length !== 0);
        this.connectBoundingPolygon(outerBoundingPolygonPointList, []);
    }
}

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            pointNumber: 50,
            points: [],
            lines: [],
            done: false
        };
        this.randomNumberPool = new RandomNumberPool();
        this.handlePointNumberChange = this.handlePointNumberChange.bind(this);
        this.handlePointNumberSubmit = this.handlePointNumberSubmit.bind(this);
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

    showAnimation() {
        const network = this.createNetwork();
        this.setState({ points: network.points, lines: [], done: false });

        const pendingLines = [...network.lines];

        this.interval = setInterval(() => {
            if (pendingLines.length !== 0) {
                const line = pendingLines.pop();
                const done = pendingLines.length === 0;
                this.setState(state => {
                    state.lines.push(line);
                    state.done = done;
                    return state;
                });
            }
        }, 250);
    }

    handlePointNumberChange(e) {
        this.setState({
            pointNumber: parseInt(e.target.value)
        });
    }

    handlePointNumberSubmit(e) {
        if (this.interval) {
            clearInterval(this.interval);
        }

        this.showAnimation();
    }

    componentDidMount() {
        this.showAnimation();
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    render() {
        return <React.Fragment>
            <div>
                <p>Point number: <input value={this.state.pointNumber} onChange={this.handlePointNumberChange} /> <button onClick={this.handlePointNumberSubmit}>Change</button>, edge number: {this.state.lines.length}</p>
            </div>
            <svg width={this.props.width} height={this.props.height} xmlns="http://www.w3.org/2000/svg">
                <g>
                    {
                        this.state.lines.map((v, i) => <React.Fragment key={i}>
                            <line x1={v[0].x} y1={this.props.height - v[0].y} x2={v[1].x} y2={this.props.height - v[1].y} stroke={i === this.state.lines.length - 1 && !this.state.done ? 'green' : 'black'} strokeWidth="1.5" />
                            {/* <text x={(v[0].x + v[1].x) / 2} y={((this.props.height - v[0].y) + (this.props.height - v[1].y)) / 2 - 10} fill="blue">{i}</text> */}
                        </React.Fragment>)
                    }
                    {
                        this.state.points.map((v, i) => <React.Fragment key={i}>
                            <circle cx={v.x} cy={this.props.height - v.y} r="3" fill="red" />
                            {/* text x={v.x} y={this.props.height - v.y - 10} fill="orange">{i}</text> */}
                        </React.Fragment>)
                    }
                </g>
            </svg>
        </React.Fragment>;
    }
}

ReactDOM.render(<App width={1024} height={1024} count={80} />, document.querySelector('#root'));