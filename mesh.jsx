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

function indexFromParameters(index1, index2, orderInsensitive = false) {
    if (orderInsensitive) {
        if (index1 > index2) {
            [index1, index2] = [index2, index1];
        }
    }
    return (index1 + index2) * (index1 + index2 + 1) / 2 + index1;
}

function distance(p1, p2) {
    return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
}

function aligned(p1, p2, p3) {
    return Math.sign((p2.x - p1.x) * (p3.x - p1.x) + (p2.y - p1.y) * (p3.y - p1.y));
}

function anticlockwise(p1, p2, p3) {
    return Math.sign((p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y));
}

function convexHull(points) {
    for (let i = 0; i < points.length; i++) {
        if (anticlockwise(points[i], points[(i + 1) % points.length], points[(i + 2) % points.length]) !== 1) {
            return false;
        }
    }

    return true;
}

class PointBand {
    static DatumPoints = [
        { x: 0.0, y: 1.0 },
        { x: -Math.sin(Math.PI * 2 / 3), y: -0.5 },
        { x: Math.sin(Math.PI * 2 / 3), y: -0.5 }
    ];

    constructor(originPoint) {
        this.originPoint = originPoint;

        this.points = [];
        this.circularLinkList = [];
        this.reversedCircularLinkList = [];
        this.datumNodeReferences = [];

        this.setupDatumPoint();
    }

    aligned(nodeIndex1, nodeIndex2) {
        return aligned(this.originPoint, this.points[nodeIndex1], this.points[nodeIndex2]);
    }

    anticlockwise(nodeIndex1, nodeIndex2) {
        return anticlockwise(this.originPoint, this.points[nodeIndex1], this.points[nodeIndex2]);
    }

    setupDatumPoint() {
        for (let i = 1; i <= PointBand.DatumPoints.length; i++) {
            this.points[-i] = { x: this.originPoint.x + PointBand.DatumPoints[i - 1].x, y: this.originPoint.y + PointBand.DatumPoints[i - 1].y };
            this.circularLinkList[-i] = (-i) % 3 - 1;
            this.reversedCircularLinkList[(-i) % 3 - 1] = -i;
        }
    }

    addNode(nodeIndex, point) {
        if (this.points[nodeIndex] !== undefined) {
            throw "Invalid parameter.";
        }

        this.points[nodeIndex] = point;

        for (let i = 1; i <= 3; i++) {
            const direction = this.anticlockwise(-i, nodeIndex);
            if (direction === 0 && this.aligned(-i, nodeIndex) > 0) {
                this.datumNodeReferences[i] = nodeIndex;
                this.circularLinkList[nodeIndex] = -i;
                return;
            } else if (direction > 0 && this.anticlockwise(nodeIndex, (-i) % 3 - 1) > 0) {
                let j = -i;
                while (j !== (-i) % 3 - 1) {
                    const k = this.circularLinkList[j];

                    if (this.anticlockwise(j, nodeIndex) > 0 && this.anticlockwise(nodeIndex, k) > 0) {
                        this.circularLinkList[nodeIndex] = k;
                        this.circularLinkList[j] = nodeIndex;
                        this.reversedCircularLinkList[nodeIndex] = j;
                        this.reversedCircularLinkList[k] = nodeIndex;
                        break;
                    }

                    j = this.circularLinkList[j]
                }

                if (j !== (-i) % 3 - 1) {
                    return;
                }
            }

        }

        throw "Unexpected.";
    }

    deleteNode(nodeIndex) {
        if (this.points[nodeIndex] === undefined) {
            throw "Invalid parameter.";
        }

        const nextNodeIndex = this.circularLinkList[nodeIndex];

        if (nextNodeIndex < 0 && this.datumNodeReferences[-nextNodeIndex] === nodeIndex) {
            delete this.datumNodeReferences[-nextNodeIndex];
        } else {
            const preNodeIndex = this.reversedCircularLinkList[nodeIndex];

            this.circularLinkList[preNodeIndex] = nextNodeIndex;
            this.reversedCircularLinkList[nextNodeIndex] = preNodeIndex;
            delete this.reversedCircularLinkList[nodeIndex];
        }

        delete this.circularLinkList[nodeIndex];
        delete this.points[nodeIndex];
    }

    getAheadNodes(startNodeIndex, count) {
        if (!this.points[startNodeIndex] === undefined) {
            throw "Invalid parameter.";
        }

        const pointList = [];

        let nodeIndex = this.circularLinkList[startNodeIndex];
        if (nodeIndex < 0 && this.datumNodeReferences[-nodeIndex] === startNodeIndex) {
            startNodeIndex = nodeIndex;
            nodeIndex = this.circularLinkList[nodeIndex];
        }

        while (pointList.length < count && nodeIndex !== startNodeIndex) {
            if (nodeIndex < 0) {
                const referredNodeIndex = this.datumNodeReferences[-nodeIndex];
                if (referredNodeIndex !== undefined) {
                    pointList.push(referredNodeIndex);
                }
            } else {
                pointList.push(nodeIndex);
            }
            nodeIndex = this.circularLinkList[nodeIndex];
        }

        return pointList;
    }
}

class Network {
    constructor(width, height, pointNumber) {
        this._randomNumberPool = new RandomNumberPool();
        this._points = this.generatePoints(width, height, pointNumber);
        this._segments = [];
        this._boundingSegmentList = new Set();
        this._internalSegmentList = new Set();
        this._adjacencyList = this._points.map((point, i) => new PointBand(point, i));
    }

    distance(index1, index2) {
        return distance(this._points[index1], this._points[index2]);
    }

    aligned(index1, index2, index3) {
        return aligned(this._points[index1], this._points[index2], this._points[index3]);
    }

    anticlockwise(index1, index2, index3) {
        return anticlockwise(this._points[index1], this._points[index2], this._points[index3]);
    }

    convexHull(indexes) {
        return convexHull(indexes.map(i => this._points[i]));
    }

    totalLength(segmentList) {
        return segmentList.reduce((length, index) => length + this.distance(...this._segments[index]), 0.0);
    }

    segmentIndex(index1, index2) {
        return indexFromParameters(index1, index2, true);
    }

    addSegment(pointIndex1, pointIndex2, bounding = false) {
        const segmentIndex = this.segmentIndex(pointIndex1, pointIndex2);
        this._segments[segmentIndex] = [pointIndex1, pointIndex2];
        if (bounding) {
            this._boundingSegmentList.add(segmentIndex);
        } else {
            this._internalSegmentList.add(segmentIndex);
        }
        this._adjacencyList[pointIndex1].addNode(pointIndex2, this._points[pointIndex2]);
        this._adjacencyList[pointIndex2].addNode(pointIndex1, this._points[pointIndex1]);
    }

    deleteSegment(pointIndex1, pointIndex2) {
        const segmentIndex = this.segmentIndex(pointIndex1, pointIndex2);
        this._adjacencyList[pointIndex1].deleteNode(pointIndex2);
        this._adjacencyList[pointIndex2].deleteNode(pointIndex1);
        this._internalSegmentList.delete(segmentIndex);
    }

    generatePoints(width, height, pointNumber) {
        const points = [];

        const center = { x: width / 2, y: height / 2 };
        const radius2 = Math.pow(Math.min(width / 2, height / 2), 2);

        const pointList = new Set();
        while (points.length < pointNumber) {
            let x = this._randomNumberPool.next() % width;
            let y = this._randomNumberPool.next() % height;

            if ((x - center.x) * (x - center.x) + (y - center.y) * (y - center.y) > radius2) {
                continue;
            }

            const pointIndex = indexFromParameters(Math.floor(x / 16), Math.floor(y / 16));
            if (pointList.has(pointIndex)) {
                continue;
            }

            if (x % 16 < 4) {
                x += 4;
            } else if (x % 16 >= 12) {
                x -= 4;
            }

            if (y % 16 < 4) {
                y += 4;
            } else if (y % 16 >= 12) {
                y -= 4;
            }

            points.push({ x, y });
            pointList.add(pointIndex);
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
            const direction = this.anticlockwise(pointList[i % pointList.length], pointList[(i + 1) % pointList.length], sourcePointIndex);
            if (direction === -1 || direction === 0 && this.aligned(sourcePointIndex, pointList[i % pointList.length], pointList[(i + 1) % pointList.length]) < 0) {
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

    findOuterConvexHull(pointList) {
        const bounding = pointList.length === this._points.length;

        if (pointList.length === 1) {
            return [pointList, []];
        }

        let j = 2;
        while (j < pointList.length && this.anticlockwise(pointList[0], pointList[1], pointList[j]) === 0) {
            j++;
        }

        if (j === pointList.length) { //All points in same line
            if (this._points[pointList[0]].x === this._points[pointList[1]].x) {
                pointList.sort((a, b) => this._points[a].y - this._points[b].y);
            } else {
                pointList.sort((a, b) => this._points[a].x - this._points[b].x);
            }
            for (let i = 0; i < pointList.length - 1; i++) {
                this.addSegment(pointList[i], pointList[i + 1]);
            }
            const boundingConvexHullPointList = [...pointList];
            for (let i = pointList.length - 2; i > 0; i--) {
                boundingConvexHullPointList.push(pointList[i]);
            }
            return [boundingConvexHullPointList, []];
        } else {
            const availablePointList = new Set(pointList);
            const initialPointList = [...pointList.splice(j, 1), ...pointList.splice(0, 2)];

            const boundingConvexHullPointList = this.normalizeTriangle(initialPointList);
            while (pointList.length !== 0) {
                const pointIndex = pointList.shift();
                const range = this.tangentRange(boundingConvexHullPointList, pointIndex);
                if (range[0] < range[1]) {
                    boundingConvexHullPointList.splice(range[0] + 1, range[1] - range[0] - 1, pointIndex);
                } else if (range[0] > range[1]) {
                    boundingConvexHullPointList.splice(range[0] + 1);
                    boundingConvexHullPointList.splice(0, range[1], pointIndex);
                }
            }

            for (let i = 0; i < boundingConvexHullPointList.length; i++) {
                this.addSegment(boundingConvexHullPointList[i], boundingConvexHullPointList[(i + 1) % boundingConvexHullPointList.length], bounding);
                availablePointList.delete(boundingConvexHullPointList[i]);
            }
            return [boundingConvexHullPointList, Array.from(availablePointList)];
        }
    }

    connectInsideConvexHull(pointList) {
        if (pointList.length <= 3) {
            return;
        }

        for (let i = 0; i < pointList.length - 2; i++) {
            for (let j = 0; j < pointList.length - 3; j++) {
                let k = (j + i + 2) % pointList.length;
                if (i < k) {
                    if (pointList.every(u => u === pointList[i] || u === pointList[k] || this.anticlockwise(pointList[i], pointList[k], u) !== 0)) {
                        //found (i, k)

                        this.addSegment(pointList[i], pointList[k]);
                        this.connectInsideConvexHull(pointList.slice(i, k + 1));
                        this.connectInsideConvexHull([...pointList.slice(k), ...pointList.slice(0, i + 1)]);
                        return;
                    }
                }
            }
        }
    }

    connectBetweenConvexHulls(outerPointList, innerPointList) {
        if (innerPointList.length === 1) {
            for (const pointIndex of outerPointList) {
                this.addSegment(pointIndex, innerPointList[0]);
            }
        } else {
            let i = 0;
            while (i < outerPointList.length && this.anticlockwise(innerPointList[0], innerPointList[1], outerPointList[i]) !== -1) {
                i++;
            }

            if (i === outerPointList.length) {
                throw "Unexpected.";
            }

            const range = this.tangentRange(innerPointList, outerPointList[i]);
            if (range[0] < range[1]) {
                for (let j = range[0]; j <= range[1]; j++) {
                    this.addSegment(outerPointList[i], innerPointList[j]);
                }
            } else if (range[0] > range[1]) {
                for (let j = range[0]; j <= range[1] + innerPointList.length; j++) {
                    this.addSegment(outerPointList[i], innerPointList[j % innerPointList.length]);
                }
            } else {
                throw "Unexpected.";
            }

            const scope = [range[1], range[0]];
            for (let k = 0; k < outerPointList.length - 1; k++) {
                i = (i + 1) % outerPointList.length;
                const range = this.tangentRange(innerPointList, outerPointList[i], scope);
                if (range[0] === range[1]) {
                    this.addSegment(outerPointList[i], innerPointList[scope[0]]);
                } else {
                    if (range[0] < range[1]) {
                        for (let j = range[0]; j <= range[1]; j++) {
                            this.addSegment(outerPointList[i], innerPointList[j]);
                        }
                    } else {
                        for (let j = range[0]; j <= range[1] + innerPointList.length; j++) {
                            this.addSegment(outerPointList[i], innerPointList[j % innerPointList.length]);
                        }
                    }
                    scope[0] = range[1];
                }
            }
        }
    }

    buildConnectionSchemeInternal(pointList) {
        const [convexHullPointList, restPointList] = this.findOuterConvexHull(pointList);
        if (restPointList.length === 0) {
            this.connectInsideConvexHull(convexHullPointList);
        } else {
            const innerConvexHullPointList = this.buildConnectionSchemeInternal(restPointList);
            this.connectBetweenConvexHulls(convexHullPointList, innerConvexHullPointList);
        }

        return convexHullPointList;
    }

    buildConnectionScheme() {
        this.buildConnectionSchemeInternal([...this._points.keys()]);
        const internalSegmentList = [...this._internalSegmentList];
        const internalSegmentTotalLength = this.totalLength(internalSegmentList);
        return [
            [...this._boundingSegmentList],
            internalSegmentList,
            internalSegmentTotalLength
        ];
    }

    selectConvexHulls(segment, sides) {
        const convexHulls = [];
        for (const side of sides) {
            if (side === 4) {

                const clockwisePointList0 = this._adjacencyList[segment[0]].getAheadNodes(segment[1], 1);
                const clockwisePointList1 = this._adjacencyList[segment[1]].getAheadNodes(segment[0], 1);

                const pointList = [
                    segment[0],
                    clockwisePointList1[0],
                    segment[1],
                    clockwisePointList0[0]
                ];

                if (!this.convexHull(pointList)) {
                    continue;
                }

                convexHulls.push({
                    pointList,
                    segments: [segment]
                });
            }
        }
        return convexHulls;
    }

    fineTuneConvexHull(convexHull) {
        const replacementLog = [];
        const influencedSegmentList = [];
        if (convexHull.pointList.length === 4) {
            let segment1 = [convexHull.pointList[0], convexHull.pointList[2]];
            let segment2 = [convexHull.pointList[1], convexHull.pointList[3]];
            const distance1 = this.distance(...segment1);
            const distance2 = this.distance(...segment2);
            if (distance1 < distance2) {
                [segment1, segment2] = [segment2, segment1];
            }

            if (distance1 > distance2 && this.segmentIndex(...convexHull.segments[0]) === this.segmentIndex(...segment1)) {
                this.deleteSegment(...segment1);
                this.addSegment(...segment2);
                replacementLog.push([
                    this.segmentIndex(...segment1),
                    this.segmentIndex(...segment2),
                    distance2 - distance1
                ]);

                influencedSegmentList.push(...[
                    [convexHull.pointList[0], convexHull.pointList[1]],
                    [convexHull.pointList[1], convexHull.pointList[2]],
                    [convexHull.pointList[2], convexHull.pointList[3]],
                    [convexHull.pointList[3], convexHull.pointList[0]]
                ].map(segment => this.segmentIndex(...segment)));
            }
        }
        return [replacementLog, influencedSegmentList];
    }

    shuffleConvexHull(convexHull) {
        const replacementLog = [];
        if (convexHull.pointList.length === 4) {
            let segment1 = [convexHull.pointList[0], convexHull.pointList[2]];
            let segment2 = [convexHull.pointList[1], convexHull.pointList[3]];
            const distance1 = this.distance(...segment1);
            const distance2 = this.distance(...segment2);
            if (this.segmentIndex(...convexHull.segments[0]) === this.segmentIndex(...segment2)) {
                [segment1, segment2] = [segment2, segment1];
            }

            this.deleteSegment(...segment1);
            this.addSegment(...segment2);
            replacementLog.push([
                this.segmentIndex(...segment1),
                this.segmentIndex(...segment2),
                distance2 - distance1
            ]);
        }
        return replacementLog;
    }

    fineTune() {
        const segmentQueue = [...this._internalSegmentList.values()];
        const segmentIndexSet = new Set(this._internalSegmentList);
        const replacementLog = [];

        while (segmentQueue.length !== 0) {
            const segmentIndex = segmentQueue.shift();
            const segment = this._segments[segmentIndex];
            segmentIndexSet.delete(segmentIndex);

            const convexHulls = this.selectConvexHulls(segment, [4]);
            for (const convexHull of convexHulls) {
                const [replacementLogFragment, influencedSegmentList] = this.fineTuneConvexHull(convexHull);
                replacementLog.push(...replacementLogFragment);
                for (const influencedSegmentIndex of influencedSegmentList) {
                    if (this._boundingSegmentList.has(influencedSegmentIndex) || segmentIndexSet.has(influencedSegmentIndex)) {
                        continue;
                    }

                    segmentQueue.push(influencedSegmentIndex);
                    segmentIndexSet.add(influencedSegmentIndex);
                }
            }
        }

        const internalSegmentList = [...this._internalSegmentList];
        const internalSegmentTotalLength = this.totalLength(internalSegmentList);

        return [
            replacementLog,
            internalSegmentList,
            internalSegmentTotalLength];
    }

    shuffle() {
        const segmentQueue = [...this._internalSegmentList.values()];
        const replacementLog = [];

        for (let k = 0; k < this._internalSegmentList.size;) {
            const randomIndex = this._randomNumberPool.next() % segmentQueue.length;
            const segmentIndex = segmentQueue[randomIndex];
            const segment = this._segments[segmentIndex];

            const convexHulls = this.selectConvexHulls(segment, [4]);
            for (const convexHull of convexHulls) {
                const replacementLogFragment = this.shuffleConvexHull(convexHull);
                replacementLog.push(...replacementLogFragment);

                for (const replacement of replacementLogFragment) {
                    segmentQueue.splice(randomIndex, 1, replacement[1]);
                    k++;
                }
            }
        }

        const internalSegmentList = [...this._internalSegmentList];
        const internalSegmentTotalLength = this.totalLength(internalSegmentList);

        return [
            replacementLog,
            internalSegmentList,
            internalSegmentTotalLength];
    }

    points() {
        return [...this._points];
    }

    getSegment(segmentIndex) {
        return this._segments[segmentIndex].map(i => this._points[i]);
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
            const line = this.network.getSegment(lineIndex);
            return <React.Fragment key={lineIndex}>
                <line x1={line[0].x} y1={this.props.height - line[0].y} x2={line[1].x} y2={this.props.height - line[1].y} stroke="black" strokeWidth="1.5" />
                {this.state.showLabel && <text x={(line[0].x + line[1].x) / 2} y={this.props.height - (line[0].y + line[1].y) / 2} stroke="blue">{lineIndex}</text>}
            </React.Fragment>;
        });
    }

    renderInternalLines() {
        return [...this.state.internalLineList]
            .map(lineIndex => {
                const line = this.network.getSegment(lineIndex);
                return <React.Fragment key={lineIndex}>
                    <line x1={line[0].x} y1={this.props.height - line[0].y} x2={line[1].x} y2={this.props.height - line[1].y} stroke="silver" strokeWidth="1.5" />
                    {this.state.showLabel && <text x={(line[0].x + line[1].x) / 2} y={this.props.height - (line[0].y + line[1].y) / 2} stroke="blue">{lineIndex}</text>}
                </React.Fragment>;
            });
    }

    renderReplacementAnimation() {
        if (this.state.replaying) {
            const oldLine = this.network.getSegment(this.state.replacementLog[this.state.currentReplayRow][0]);
            const newLine = this.network.getSegment(this.state.replacementLog[this.state.currentReplayRow][1]);
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
            {this.state.showLabel && <text x={point.x} y={this.props.height - point.y} stroke="brown">{pointIndex}</text>}
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