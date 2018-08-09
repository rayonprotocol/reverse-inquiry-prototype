import Web3 from 'web3';
import TruffleContract from 'truffle-contract';

// event
import { RayonEvent } from 'common/model/RayonEvent';

let web3: Web3;
let userAccount: string;

type RayonEventListener = ((eventType: RayonEvent, event: any) => void);
type ContractDeployListner = () => void;

abstract class ContractAgent {
  public static FROM_BLOCK = '0'; // event watch start block
  public static NETWORK_PORT = 7545;

  private _watchEvents: Set<RayonEvent>;
  private _eventStarted: boolean;
  protected _eventListener: RayonEventListener;

  private _contract: JSON; // include ABI, contract address
  protected _contractInstance;

  constructor(contract: JSON, watchEvents: Set<RayonEvent>) {
    web3 = this.setWeb3();
    web3.eth.getAccounts((err, accounts) => {
      userAccount = accounts[0];
    });
    this._contract = contract;
    this._watchEvents = watchEvents;
    this.fetchContractInstance();
  }

  /*
  Essential excuted functions
  */

  private setWeb3 = (): Web3 => {
    let web3: Web3 = (window as any).web3 as Web3;
    typeof web3 !== 'undefined'
      ? (web3 = new Web3(web3.currentProvider))
      : (web3 = new Web3(new Web3.providers.HttpProvider(`http://localhost: ${ContractAgent.NETWORK_PORT}`)));
    return web3;
  };

  private async fetchContractInstance() {
    // Bring a ABI, Make a TruffleContract object
    const contract = TruffleContract(this._contract);
    contract.setProvider(this.getWeb3().currentProvider);

    // find rayon token instance on blockchain
    try {
      this._contractInstance = await contract.deployed();
    } catch (error) {
      console.error(error);
    }
    if (!this._eventStarted) this.startEventWatch();
  }

  private startEventWatch() {
    if (this._watchEvents) return;
    if (this._contractInstance === undefined) {
      console.error(`contract Instance is undefined, please check network port ${ContractAgent.NETWORK_PORT}`);
      return;
    }

    const eventRange = this.getEventRange();

    this._watchEvents.forEach(eventType => {
      const targetEventFunction = this._contractInstance[RayonEvent.getRayonEventName(eventType)]({}, eventRange);
      targetEventFunction.watch(this.onEvent.bind(this, eventType));
    });
    this._eventStarted = true;
  }

  // prevent call a undefined contract instance by data conroller
  // check contract instance is undefined and refetch
  protected async checkAndFetchContractInstance() {
    !this._contractInstance && (await this.fetchContractInstance());
  }

  /*
  Watch blockchain event and set, notify to DataCcontroller.
  and Event handler
  */

  public setEventListner(listner: RayonEventListener) {
    this._eventListener = listner;
  }

  // when event trigger on blockchain, this handler will occur
  private onEvent(eventType: RayonEvent, error, event): void {
    console.log('event', event);
    if (error) console.error(error);
    this._eventListener && this._eventListener(eventType, event);
  }

  /*
  Common value getter function
  */
  public getWeb3() {
    return web3;
  }

  public getUserAccount() {
    return userAccount;
  }

  public getEventRange() {
    return { fromBlock: ContractAgent.FROM_BLOCK, toBlock: 'latest' };
  }
}

export default ContractAgent;