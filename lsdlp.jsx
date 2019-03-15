const blob = new Blob([`
const MAX_UINT32 = Math.pow(2, 32);

function simulate(segmentSize) {
    const batchSize = Math.min(Math.floor(65536 / (segmentSize - 1) / 4), 1024);
    const array = new Uint32Array(batchSize * (segmentSize - 1));
    self.crypto.getRandomValues(array);

    const segmentLengths = new Array(segmentSize).fill(0);
    for (let i = 0; i < batchSize; i++) {
        const slice = array.slice(i * (segmentSize - 1), (i + 1) * (segmentSize - 1));
        slice.sort();
        segmentLengths[0] += Math.abs(slice[0] / MAX_UINT32);
        for (let j = 1; j < segmentSize - 1; j++) {
            segmentLengths[j] += Math.abs(slice[j] / MAX_UINT32 - slice[j - 1] / MAX_UINT32);
        }
        segmentLengths[segmentSize - 1] += Math.abs(1.0 - slice[segmentSize - 2] / MAX_UINT32);
    }

    return [batchSize, segmentLengths];
}

self.onmessage = (event) => {
    const segmentSize = event.data;
    postMessage(simulate(segmentSize));
};
`], { type: 'application/javascript' });

class Panel extends React.Component {

    constructor(props) {
        super(props);
        this.state = this.newState(3);
        this.handleChange = this.handleChange.bind(this);
    }

    newState(segmentSize) {
        const segmentLengths = new Array(segmentSize).fill(0.0);
        return {
            startTime: new Date(),
            segmentSize,
            batchSize: 0,
            segmentLengths,
            segments: segmentLengths.map((length, index) => ({
                index: index,
                length: 0.0
            }))
        };
    }

    handleChange(e) {
        const segmentSize = parseInt(e.target.value);
        if (segmentSize > 1 && segmentSize <= 1024) {
            this.setState(state => {
                if (state.segmentSize !== segmentSize) {
                    return this.newState(segmentSize);
                } else {
                    return state;
                }
            });
        }
    }

    render() {
        return (
            <Reactstrap.Jumbotron>
                <h1 className="display-4">Line Segment Desired Length Problem Simulator</h1>
                <Reactstrap.InputGroup>
                    <Reactstrap.Input placeholder="3" type="number" step="1" value={this.state.segmentSize} onChange={this.handleChange} />
                    <Reactstrap.InputGroupAddon addonType="prepend">segments</Reactstrap.InputGroupAddon>
                </Reactstrap.InputGroup>
                <Reactstrap.Table>
                    <tr>
                        <th>Test rounds</th>
                    </tr>
                    <tr>
                        <td>{(this.state.batchSize / 1000000).toFixed(1)}M ({(this.state.batchSize / 1000000 / ((new Date() - this.state.startTime) / 1000)).toFixed(1)}M per seconds)</td>
                    </tr>
                    <tr>
                        <th>Desired length distribution for {this.state.segmentSize} segments</th>
                    </tr>
                    <tr>
                        <Recharts.BarChart data={this.state.segments} width={600} height={250}>
                            <Recharts.CartesianGrid strokeDasharray="3 3" />
                            <Recharts.XAxis dataKey="index" />
                            <Recharts.YAxis />
                            <Recharts.Bar dataKey="length" fill="#8884d8" />
                        </Recharts.BarChart>
                    </tr>
                    <tr>
                        <td>
                            {this.state.segmentLengths.map((v, i) => (
                                <p><i>Segment {i}</i>:&nbsp;&nbsp;&nbsp;&nbsp;{v / this.state.batchSize}</p>
                            ))}
                        </td>
                    </tr>
                </Reactstrap.Table>
            </Reactstrap.Jumbotron>
        );
    }

    componentDidMount() {
        this.workers = new Array(8).fill(new Worker(URL.createObjectURL(blob)));
        this.workers.forEach((worker, index) => {
            worker.onmessage = (event) => {
                const [actualBatchSize, segmentLengths] = event.data;
                this.setState(state => {
                    const batchSize = state.batchSize + actualBatchSize;
                    for (let i = 0; i < Math.min(segmentLengths.length, this.state.segmentSize); i++) {
                        state.segmentLengths[i] += segmentLengths[i];
                    }
                    return {
                        batchSize,
                        segmentLengths: state.segmentLengths,
                        segments: state.segmentLengths.map((length, index) => ({
                            index: index,
                            length: length / batchSize
                        }))
                    };
                });
                worker.postMessage(this.state.segmentSize);
            };
            worker.postMessage(this.state.segmentSize);
        });
    }
}

ReactDOM.render(<Panel />, document.getElementById('root'));