import React, {Component} from 'react';
import './App.css';
import {callChaincode,createNewAsset,getKeypairFromSeed} from './service.js';
import {AppInsights} from 'applicationinsights-js';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      inputValue: '',
      inputPassphrase: '',
      inputAsset: ''
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleCreate = this.handleCreate.bind(this);
    // initialize application insights
    AppInsights.downloadAndSetup({
      instrumentationKey: String(process.env.REACT_APP_APPLICATION_INSIGHTS_KEY)
    });
  }
  handleValueChange(event) {
    this.setState({inputValue: event.target.value})
  }
  handlePassphraseChange(event) {
    this.setState({inputPassphrase: event.target.value})
  }
  handleAssetChange(event) {
    this.setState({inputAsset: event.target.value})
  }
  handleSubmit(event) {
    if(this.state.inputValue) {
      event.preventDefault();
      console.log('inputValue: ' + this.state.inputValue);
      AppInsights.trackEvent("UISubmit", {
        assetId: this.state.inputValue
      });
      callChaincode(this.state.inputValue);
    }
  }
  async handleCreate(event) {
    if(this.state.inputAsset && this.state.inputPassphrase) {
      event.preventDefault();
      const keyPair = getKeypairFromSeed(this.state.inputPassphrase);
      const asset = {
        number: parseInt(this.state.inputAsset.toString(),10),
        timestamp: Date.now()
      }
      const tx = await createNewAsset(keyPair, asset, null);
      console.log(tx);
      this.setState({inputValue: tx.id});
    }
  }
  render() {
    return (<section className="jumbotron text-center">
      <div className="container">
        <h1><strong>BigchainDB</strong> integration with <strong>Hyperledger Fabric</strong></h1>
        <br/><br/>
        <div className="alert alert-warning">
          This UI is for demo usage of the BigchainDB-Hyperledger Fabric oracle. The following form first we create a BigchainDB asset by providing passphrase and asset data. Once the asset is created, the asset id is passed to a Hyperledger chain-code which internally passes it to the oracle. The oracle then queries BigchainDB with the asset id and executes a callback passed by the Hyperledger chain-code.<br/>
          The oracle then sends back the results to Hyperledger chain-code.
          <br/><br/>
          In a real scenario, the chain-code can do pre-processing and create a dynamic callback before sending the request to the oracle.
        </div>
        <br/><br/>
        <div className="row">
          <div className="col-6">
            <h4 className="jumbotron-heading">BigchainDB asset creation</h4>
            <br/>
            <div className="lead-body">
              <form className="inputForm" onSubmit={this.handleCreate}>
                <div>
                  <label htmlFor="inputPassphrase" className="sr-only">Passphrase:</label>
                  <input type="text" name="inputPassphrase" id="inputPassphrase" className="form-control" placeholder="Passphrase" value={this.state.inputPassphrase} onChange={this.handlePassphraseChange.bind(this)}/>
                </div>
                <br/>
                <div>
                  <label htmlFor="inputAsset" className="sr-only">Asset:</label>
                  <textarea type="text" name="inputAsset" id="inputAsset" className="form-control" placeholder="Enter a number" value={this.state.inputAsset} onChange={this.handleAssetChange.bind(this)}></textarea>
                </div>
                <br/>
                <div>
                  <button className="btn btn-lg btn-primary btn-block" type="submit">Create asset</button>
                </div>
              </form>
            </div>
          </div>
          <div className="col-6">
            <h4 className="jumbotron-heading">Hyperledger Fabric Oracle</h4>
            <br/>
            <div className="lead-body">
              <form className="inputForm" onSubmit={this.handleSubmit}>
                <div>
                  <label htmlFor="inputValue" className="sr-only">Value:</label>
                  <input type="text" name="inputValue" id="inputValue" className="form-control" placeholder="Asset id" value={this.state.inputValue} onChange={this.handleValueChange.bind(this)}/>
                </div>
                <br/>
                <div>
                  <button className="btn btn-lg btn-primary btn-block" type="submit">Send to Hyperledger</button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div className="footer">
          Developed By: <a href="https://www.bigchaindb.com">BigchainDB</a> and <a href="https://theledger.be">TheLedger</a>
        </div>
      </div>
    </section>)
  }
}

export default App;
