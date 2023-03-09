import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Group } from '../_modules/group';
import { Message } from '../_modules/message';
import { User } from '../_modules/user';
import { getPaginatedResult, getPaginationHeaders } from './paginationHelper';

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  baseUrl = environment.apiUrl;
  hubUrl = environment.hubUrl;
  private hubConnection?: HubConnection;
  private messageThreadSource = new BehaviorSubject<Message[]>([]);
  messageThread$ = this.messageThreadSource.asObservable();

  constructor(private http:HttpClient) { }

  createHubConnection(user:User, otherUserName: string)
  {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(this.hubUrl+'message?user='+otherUserName,{
        accessTokenFactory: () => user.token
      })
      .withAutomaticReconnect()
      .build();

      this.hubConnection.start().catch(error => console.log(error));

      this.hubConnection.on("ReciveMessageThread", messages => {
        this.messageThreadSource.next(messages);
      })

      this.hubConnection.on('UpdatedGroup', (group: Group) => {
        if(group.connections.some(x=>x.username === otherUserName))
        {
          this.messageThread$.pipe(take(1)).subscribe({
            next: messages => {
                messages.forEach(message => {
                  if(!message.dateRead){
                    message.dateRead = new Date(Date.now())
                  }
                })
                this.messageThreadSource.next([...messages]);
            }
          })
        }
      })

    this.hubConnection.on("NewMessages", message =>
    {
      this.messageThread$.pipe(take(1)).subscribe({
        next: messages => {
          this.messageThreadSource.next([...messages,message ])
        }
      })
    })
  }

  stopHubConnection()
  {
    if(this.hubConnection)
    {
    this.hubConnection?.stop();}
  }

  getMessages(pageNumber:number,pageSize:number,container:string)
  {
    let params = getPaginationHeaders(pageNumber,pageSize);
    params = params.append('Container',container);
    return getPaginatedResult<Message[]>(this.baseUrl+'messages',params,this.http);
  }

  getMessageThread(username:string)
  {
    return this.http.get<Message[]>(this.baseUrl + "messages/thread/"+username);
  }

  async sendMessage(username:string, content: string )
  {
    return this.hubConnection?.invoke('SendMessage', {recipientUsername: username, content})
      .catch(error => console.log(error));
  }

  deleteMessage(id:number)
  {
    return this.http.delete(this.baseUrl + 'messages/'+ id);
  }
}
