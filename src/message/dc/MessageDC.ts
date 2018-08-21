// agent
import MessageServerAgent from 'message/agent/MessageServerAgent';

// model
import Message from 'message/model/Message';
import { RayonEvent, RayonEventResponse, LogSendReverseInquiryMessageArgs } from 'common/model/RayonEvent';

// dc
import RayonDC from 'common/dc/RayonDC';
import ReverseInquiry from 'reverseinquiry/model/ReverseInquiry';

type MessagesListner = (reverseInquiries: Map<number, Message[]>) => void;

class MessageDC extends RayonDC {
  _messagesListner: Set<MessagesListner>;
  _messages: Map<number, Message[]>;

  constructor() {
    super();
    this._messagesListner = new Set();
    this._messages = new Map();
    MessageServerAgent.setEventListner(this.onEvent.bind(this));
  }

  /*
  event handler
  */
  private onEvent(eventType: RayonEvent, event: any): void {
    console.log('onEvent message');
    switch (eventType) {
      case RayonEvent.LogSendReverseInquiryMessage:
        this.onReverseInquiryMessageSent(event);
        break;
      default:
        break;
    }
  }

  private onReverseInquiryMessageSent(event: RayonEventResponse<LogSendReverseInquiryMessageArgs>) {
    const userAccount = this.getUserAccount();
    if (event.args.fromAddress !== userAccount && event.args.toAddress !== userAccount) return;
    this._eventListeners[RayonEvent.LogSendReverseInquiryMessage] &&
      this._eventListeners[RayonEvent.LogSendReverseInquiryMessage].forEach(listner => {
        listner(event);
      });
  }

  /*
  auction contents handler
  */
  public addMessagesListeners(listener: MessagesListner) {
    this._messagesListner.add(listener);
  }

  public removeMessagesListeners(listener: MessagesListner) {
    this._messagesListner.delete(listener);
  }

  private onMessagesFetched(messages: Map<number, Message[]>) {
    this._messagesListner && this._messagesListner.forEach(listener => listener(messages));
  }

  /*
    communicate to auction
  */
  public sendMessage(
    toAddress: string,
    previousMessageId: number,
    reverseInquiryId: number,
    msgType: number,
    payload: string
  ) {
    MessageServerAgent.sendMessage(toAddress, previousMessageId, reverseInquiryId, msgType, payload);
  }

  public async fetchMessages(auctionContents: ReverseInquiry[]) {
    if (this._messages.size !== 0) {
      this.onMessagesFetched(this._messages);
      return;
    }
    if (auctionContents === undefined) console.error('auctionContents is undefined');

    for (let i = 0; i < auctionContents.length; i++) {
      const auctionId = auctionContents[i].id;
      this._messages[auctionId] = await MessageServerAgent.fetchReverseInquiryMessages(auctionId);
    }

    this.onMessagesFetched(this._messages);
  }
}

export default new MessageDC();
