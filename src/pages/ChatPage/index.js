/*
 * Copyright 2021 WPPConnect Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { toast } from "react-toastify";
import CircularProgress from "@material-ui/core/CircularProgress";
import { Picker } from "emoji-mart";
import CancelIcon from "@material-ui/icons/Cancel";
import {
    ChatContainer,
    Contador,
    Container,
    ContentContainer,
    HeaderContact,
    Layout,
    WaitingContainer,
    ReplyContainer,
    LoadMoreComponent
} from "./style";
import {
    CheckCircle,
    Mic,
    Paperclip,
    Send,
    Smile,
    XCircle,
    X,
} from "react-feather";
import api from "../../services/api";
import ImageLoader from "../../assets/ic_loader_chat.svg";
import ChatComponent from "../../components/ChatPage/ChatComponent";
import ConversasComponent from "../../components/ChatPage/ConversasComponent";
import { getSession, getToken } from "../../services/auth";
import config from "../../util/sessionHeader";
import MicRecorder from "mic-recorder-to-mp3";
import BackdropComponent from "../../components/BackdropComponent";
import NotificationSound from "../../assets/notification.mp3";
import { listenerMessages } from "../../services/socket-listener";
import { MyTooltip } from "../../components/MyTooltip";
import "emoji-mart/css/emoji-mart.css";
import { display } from "@mui/system";

const SendMessagePage = () => {
    const dropRef = useRef(null);
    const [allMessages, setAllMessages] = useState([]);
    const [chats, setChats] = useState([]);
    const [data, setData] = useState([]);
    const [choosedContact, setChoosedContact] = useState(null);
    const [imgContact, setImgContact] = useState("");
    const [message, setMessage] = useState("");
    const chatRef = useRef(null);
    const messagesEnd = useRef(null);
    const [recordState, setRecordState] = useState(null);
    const [seconds, setSeconds] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const [stop, setStop] = useState(true);
    const [isBlocked, setIsBlocked] = useState(false);
    const recorder = useMemo(() => new MicRecorder({ bitRate: 128 }), []);
    const [openLoading, setOpenLoading] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [emoji, setEmoji] = useState(false);
    const [hasMessages, setHasMessages] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);




    //Checking if messages exist
    //This hook watches for changes in allMessages (an array of messages for the selected chat). 
    // If the list now has at least one message and hasMessages is false, it sets hasMessages to true.
    useEffect(() => {
        if (allMessages?.length > 0 && !hasMessages) {
            setHasMessages(true);
        }
    }, [allMessages]);




    //Check WhatsApp Web connection & load chats/contacts

    useEffect(() => {
        async function checkConnection() {
            try {
                await api.get(`${getSession()}/check-connection-session`, config()); //Calls a backend endpoint to verify the WhatsApp Web session.
                await getAllChats();   //Loads all chats (getAllChats()).
                await getAllContacts();  //Loads all contacts (getAllContacts()).
            } catch (e) {
                // history.push("/");
            }
        }

        checkConnection();

        return () => {
            setChats([]);   //When component unmounts, it clears chat list with setChats([]).

        };
    }, []);


    // Timer logic (stopwatch style)

    //This useEffect handles a timer which:
    useEffect(() => {
        if (stop === false) {
            const intervalId = setInterval(() => {   //increments seconds every 1000ms (1 second).
                setSeconds(seconds => {
                    if (seconds >= 59) {    //If seconds reach 59, it:
                        zero();            //resets it to zero
                        incrementMinutes();  //increment minute
                    }

                    return seconds + 1;
                });
            }, 1000);

            return () => {
                clearInterval(intervalId);  //Clears the timer when the component unmounts or the effect reruns, preventing memory leaks.
            };
        }
    }, [seconds, stop]);



    // Listener for incoming messages
    listenerMessages((err, data) => {
        if (err) return;    //error checking

        if (!data.response.fromMe) {    //play notification sound 
            const audio = new Audio(NotificationSound);
            audio.play();
        }


        // Update chats:
        (async function () {
            const { data: { response } } = await api.get(`${getSession()}/all-chats-with-messages`, config());  //fetch all chats with messages

            const arr = [];                          //filter archived messages
            for (const elem of response) {
                if (!elem.archive) {
                    arr.push(elem);
                }
            }

            setChats(arr);    //update 
            setData(arr);    //update
        })()


        //auto scroll chat view
        if (chatRef.current !== null) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }


        //Update message thread if current contact matches:
        if (choosedContact?.id !== undefined) {
            if (choosedContact?.id === data.response.chatId || data.response.fromMe && choosedContact?.id._serialized === data.response.to) {
                setAllMessages((prevState) => {
                    return [...prevState, data.response];
                });
                scrollToBottom();
            }
        }
    });


    // Fetch all contacts from the WhatsApp session and filter them to only include valid saved contacts.
    async function getAllContacts() {
        const { data } = await api.get(`${getSession()}/all-contacts`, config());  //fetch contacts from backend
        const arr = [];

        for (const contact of data.response) {              //contact in my list and contatc has valid user id
            if (contact.isMyContact && contact?.id.user !== undefined)
                arr.push(contact);
        }    //update the contact with filtered contacts

        setContacts(arr);
    }


    //set both seconds and minutes to zero
    function zeroStopwatch() {
        setSeconds(0);
        setMinutes(0);
    }


    //recording voice using microphone
    const startRecording = () => {
        navigator.getUserMedia({ audio: true },    //ask for microphone access
            () => {
                // alert("Permission Granted");
                setIsBlocked(false);
            },
            () => {
                alert("Permission Denied");
                setIsBlocked(true);
            },
        );


        //ask for calls
        if (isBlocked) {
            alert("Permission Denied");
        } else {
            recorder.start().then(() => {
                setRecordState(true);
                setStop(false);
            }).catch((e) => {
                console.error(e);
            });
        }
    };


    //cancel an in-progress voice recording
    function cancelRecording() {
        // mediaRecorder.stop();

        setRecordState(null);//close recording state
        setStop(true);  //stop timer
        zeroStopwatch(); //resets time
    }


    //end recording and send voice recording to backend
    const finishRecording = () => {
        setRecordState(null);
        setStop(true);
        zeroStopwatch();

        recorder.stop().getMp3().then(([buffer, blob]) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async function () {
                const base64data = reader.result;
                await api.post(`${getSession()}/send-voice`, {
                    url: base64data,
                    phone: choosedContact?.id,
                }, config());
            };

            const file = new File(buffer, "audio.mp3", {
                type: blob.type,
                lastModified: Date.now()
            });
            new Audio(URL.createObjectURL(file));

        }).catch((e) => {
            alert("We could not retrieve your message");
            console.log(e);
        });
    };


    //increment minute
    function incrementMinutes() {
        setMinutes((prevState) => prevState + 1);
    }

    //reset second to zero
    function zero() {
        setSeconds(0);
    }



    //getAllChats with msgs


    async function fetchChats() {
        const { data: { response } } = await api.get(`${getSession()}/all-chats-with-messages`, config());
        console.log("Data",data?.response);
        //filter archived chats
        return response.filter(chat => !chat.archive);
    }
    async function getAllChats() {
        try {
            const filteredChats = await fetchChats();
            console.log("Filtered Chats",filteredChats);
            
            setChats(filteredChats);
            setData(filteredChats);
        } catch (e) {
            console.error("Error fetching chats", error);

            try {
                const filteredChats = await fetchChats();
                setChats(filteredChats);
                setData(filteredChats);
            } catch (error) {
                console.error("Retry also failed", retryError);
                setChats([]);
                setData([]);
                setError("Unavle to fetch chats at this time . Please try again later");
            }
        }
    }
    //smoth scroll for msg container to latest msg
    const scrollToBottom = () => {
        if (messagesEnd.current !== null) {
            messagesEnd.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    const onClickContact = useCallback(async (contact) => {
        setImgContact("");
        setChoosedContact(contact);
        setOpenLoading(true);
        setAllMessages([]);
        setHasNoMore(false);

        console.log(contact, 'contact')
        // if (contact?.id.server.includes('c.us')) {
        //     alert("chat clicked");
        // }
        // else {
        //     alert("group clicked");
        // }
        //    console.log(contact?.id.server.includes("g.us"));
        //error in regex
        try {
            if (contact?.id.server.includes("c.us")) {
                const { data } = await api.get(`${getSession()}/all-messages-in-chat/${contact?.id.user}`, config());

                await api.post(`${getSession()}/send-seen`, { phone: contact?.id.user }, config());
                console.log(data, 'data')
                setAllMessages(data?.response || []);
                console.log('response', data?.response);
            } else if (contact?.id.server.includes("g.us")) {
                
                const isGroup = contact?.id?.server === "g.us";
                const { data } = await api.get(`${getSession()}/all-messages-in-chat/${contact?.id.user}${isGroup ? "?isGroup= true" : " "}`, config());
                await api.post(`${getSession()}/send-seen`, { phone:contact?.id.user,isGroup  }, config());
                setAllMessages(data?.response || []);
                console.log('Response :', data?.response);
            } else {
                setAllMessages([]);
            }
        } catch (e) {
            console.log("Error message",e.message);
        }

        scrollToBottom();
        contact.unreadCount = 0;
        setOpenLoading(false);
    }, []);


    //used after sending message or reset the input 
    function clearAndScrollToBottom() {
        setMessage("");
        setEmoji(false);
        scrollToBottom();
    }
    //emoji picker
    function addEmoji(e) {
        let emoji = e.native;
        setMessage(message + emoji);
    }


    async function sendMessage() {
        if (!!message.trim() && !!getSession()) {
            //   const by = `*${getUser()}:* \n\n`;
            const by = "";
            let endpoint = "send-message";

            // Extract phone number by removing everything after "@" (including "@")
            const getPhone = (id) => {
                if (typeof id === 'string') {
                    return id.split('@')[0];
                } else if (id && typeof id._serialized === 'string') {
                    return id._serialized.split('@')[0];
                }
                return '';
            };

            const body = {
                phone: getPhone(choosedContact?.id),
                message: by + message,
            };

            if (typeof choosedContact?.id === 'string' && choosedContact?.id.includes("@g.us")) {
                body.isGroup = true;
            }

            if (selectedMessage) {
                body.messageId = selectedMessage?.id;
                endpoint = "send-reply";
            }

            await api.post(`${getSession()}/${endpoint}`, body, config());
            clearAndScrollToBottom();
            setSelectedMessage(null);
        } else {
            toast.error("Enter a message", {
                position: "bottom-center",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }
    }

    //
    function onChangeAnexo(e) {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            const filename = e.target.files[0].name;
            reader.readAsDataURL(e.target.files[0]);

            reader.onload = async function (e) {
                const base64 = e.target.result;
                const options = {
                    base64: base64,
                    phone: typeof choosedContact?.id === 'string' ? choosedContact?.id.replace(/[@c.us,@g.us]/g, "") : '',
                    message: "",
                    filename: filename,
                };
                if (typeof choosedContact?.id === 'string' && choosedContact?.id.includes("@g.us")) {
                    options.isGroup = true;
                }
                try {
                    await api.post(`${getSession()}/send-file-base64`, options, config());
                } catch (error) {
                    console.log("Catch onChangeAnexo()", error);
                }
            };
        }
    }

    function searchChat(e) {
        const { value } = e.target;

        const filterContact = contacts.filter((filtro) => {
            if (filtro.name && filtro?.id._serialized) {
                return (
                    filtro.name
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .toLowerCase()
                        .indexOf(value.toLowerCase()) > -1 ||
                    filtro?.id._serialized.indexOf(value) > -1
                );
            } else {
                return [];
            }
        });

        const filterChat = chats.filter((filtro) => {
            if (filtro.name && filtro?.id) {
                return (
                    filtro.name
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .toLowerCase()
                        .indexOf(value.toLowerCase()) > -1 || filtro?.id.indexOf(value) > -1
                );
            } else {
                return [];
            }
        });

        const searchArr = [];

        for (const chat of filterChat) {
            searchArr.push({
                name: chat.name,
                id: chat?.id,
                unreadCount: 0,
            });
        }

        for (const contact of filterContact) {
            searchArr.push({
                name: contact.name,
                id: contact?.id._serialized,
                unreadCount: 0,
                msgs: null,
            });
        }

        const filterArr = removeDuplicates(searchArr);
        setChats(filterArr);

        if (value === "") {
            setChats(data);
        }
    }

    const removeDuplicates = (arr) => {
        return arr.filter((item, index, self) => {
            if (item.name) return (index === self.findIndex((t) => t?.id === item?.id && t.name && item.name));
        });
    };

    const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
    const [hasNoMore, setHasNoMore] = useState(false);
    //fetch older message and prepending them to current list
    async function loadMore() {
        // alert('ss')
        // if (!choosedContact || !choosedContact?.id || typeof choosedContact?.id !== 'string') {
        //     console.warn("Invalid contact selected");
        //     return;
        // }
        setLoadingMoreMessages(true);
        console.log(choosedContact, 'choosedContact')
        try {
            let param = "?isGroup=false";
            // if (choosedContact?.id.server.includes("@g.us")) {
            //     param = "?isGroup=true";
            // }
            const { data } = await api.get(
                `${getSession()}/load-earlier-messages/${choosedContact?.id.user}${param}`,
                config()
            );
            if (data && data.response && Array.isArray(data.response)) {
                setAllMessages((prev) => [...data.response, ...prev]);
            }
            if (data && !data.response) {
                setHasNoMore(true);
            }
        } catch (e) {
            console.log("Error message", e.message);
        } finally {
            setLoadingMoreMessages(false);
        }
    };

    return (
        <Layout>
            <Container ref={dropRef}>
                <ContentContainer>
                    <ConversasComponent
                        chats={chats}
                        setChats={setChats}
                        onClickContact={onClickContact}
                        onSearch={searchChat}
                    />

                    <BackdropComponent open={openLoading} />
                    <div className="chat-wrapper" style={{ display: "flex", height: "100vh" }}>
                        <div style={{ width: "30%", overflow: "hidden", listStyle: 'none' }} >
                            {chats.map((chat) => (
                                <li
                                    key={chat?.id}
                                    className={`contact-li ${choosedContact?.id === chats?.id ? "active" : " "}`}
                                    onClick={() => choosedContact(chats)}
                                >
                                    {chats.name || chats?.id}
                                </li>
                            ))}
                        </div>
                    </div>
                    {/* <ul id="all-contacts">

                    </ul> */}
                    {choosedContact ? (
                        <ChatContainer >
                            {choosedContact && choosedContact?.length <= 0 ? null : (
                                <HeaderContact>
                                    <div className={"container-info-ctt"}>
                                        <img
                                            src={
                                                imgContact ||
                                                `https://ui-avatars.com/api/?name=${choosedContact?.name}?background=random`
                                            }
                                            alt={choosedContact?.name}
                                            loading={"lazy"}
                                            onError={(e) =>
                                            (e.target.src =
                                                "https://pbs.twimg.com/profile_images/1259926100261601280/OgmLtUZJ_400x400.png")
                                            }
                                        />
                                        <h3>
                                            {choosedContact?.name === undefined
                                                ? choosedContact?.id
                                                    .replace(/[@c.us,@g.us]/g, "")
                                                : choosedContact?.name}
                                        </h3>
                                    </div>
                                </HeaderContact>
                            )}

                            <ul ref={chatRef} style={{ overflowX: "hidden" }}>
                                {!hasNoMore && hasMessages && allMessages?.length > 0 && (
                                    <LoadMoreComponent onClick={loadMore}>
                                        Loading More..{loadingMoreMessages && <>&nbsp;&nbsp;&nbsp;<CircularProgress size={10} /></>}
                                    </LoadMoreComponent>
                                )}

                                {!allMessages?.length ? (
                                    <WaitingContainer>
                                        <div>
                                            <img src={ImageLoader} alt={"Smartphone"} />
                                            <h2>Choose a contact to start a conversation</h2>
                                        </div>
                                    </WaitingContainer>
                                ) : (
                                    <div>
                                        {allMessages.map((message) => {
                                            return (
                                                <li key={message?.id} id={message?.id}>
                                                    <ChatComponent
                                                        isMe={message.fromMe ? "right" : "left"}
                                                        isWarning={
                                                            !message?.body &&
                                                            message.type !== "chat" &&
                                                            !["ptt", "audio"].includes(message.type)
                                                        }
                                                        session={getSession()}
                                                        token={getToken()}
                                                        message={message}
                                                        selectMessageId={() => setSelectedMessage(message)}
                                                    />
                                                </li>
                                            );
                                        })}
                                    </div>
                                )}

                                <div ref={messagesEnd} />
                            </ul>

                            {!!selectedMessage && (
                                <ReplyContainer>
                                    <div className="content">
                                        <ChatComponent
                                            isMe={selectedMessage.fromMe ? "right" : "left"}
                                            isWarning={!selectedMessage?.body && selectedMessage.type !== "chat" && !["ptt", "audio"].includes(selectedMessage.type)}
                                            session={getSession()}
                                            token={getToken()}
                                            message={selectedMessage}
                                            selectMessageId={() => { }}
                                        />
                                    </div>
                                    <div>
                                        <MyTooltip
                                            name="Cancel"
                                            icon={<CancelIcon />}
                                            onClick={() => setSelectedMessage(null)}
                                        />
                                    </div>
                                </ReplyContainer>
                            )}

                            {emoji ? <Picker onSelect={addEmoji} /> : null}
                            {choosedContact?.length <= 0 ? null : (
                                <div className={"bottom-container"}>
                                    <textarea
                                        placeholder={"Type your message here."}
                                        onKeyDown={(event) => {
                                            if (event.ctrlKey && event.key === "Enter") {
                                                sendMessage();
                                            }
                                        }}
                                        value={message}
                                        onChange={(e) => {
                                            setMessage(e.target.value);
                                        }}
                                    />

                                    <div className={"action-buttons"}>
                                        <div>
                                            {emoji ? (
                                                <button onClick={() => setEmoji(false)}>
                                                    <X />
                                                </button>
                                            ) : (
                                                <button onClick={() => setEmoji(true)}>
                                                    <Smile />
                                                </button>
                                            )}

                                            <label>
                                                <input type={"file"} onChange={onChangeAnexo} />
                                                <div className={"attach-info"}>
                                                    <Paperclip />
                                                </div>
                                            </label>

                                        </div>

                                        {message === "" ? (
                                            recordState === null ? (
                                                <Mic onClick={startRecording} />
                                            ) : (
                                                <Contador>
                                                    <div className={"main-cont"}>
                                                        <XCircle onClick={cancelRecording} />
                                                        <div className={"counter"}>
                                                            <p>
                                                                {minutes === 0
                                                                    ? `${seconds}s`
                                                                    : `${minutes}m ${seconds}s`}
                                                            </p>
                                                        </div>
                                                        <CheckCircle onClick={() => finishRecording()} />
                                                    </div>
                                                </Contador>
                                            )
                                        ) : (
                                            <Send onClick={(e) => sendMessage(e)} />
                                        )}
                                    </div>
                                </div>
                            )}
                        </ChatContainer>) : (
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#9999", width: "100%", backgroundColor: 'lightblue', fontSize: '20px' }}>
                            <img src={ImageLoader} alt={"Smartphone"} height={"150vh"} />
                            <br />
                            <h2>Choose a contact to start a conversation</h2>
                        </div>
                    )}
                </ContentContainer>
            </Container>
        </Layout>
    );
};

export default SendMessagePage;