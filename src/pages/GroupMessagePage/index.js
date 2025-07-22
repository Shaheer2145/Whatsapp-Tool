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

import React, { useState, useEffect } from "react";
import { CentralContainer, Container, Layout, LeftContainer, RightContainer } from "./style";
import api from "../../services/api";
import { getSession } from "../../services/auth";
import config from "../../util/sessionHeader";
import { DataGrid } from "@mui/x-data-grid";
import { FilePlus, Sheet, ListOrdered, UserPlus } from "lucide-react";
import { TableContainer, HeaderComponent } from "pages/Contacts/style";
import { IconButton } from "@mui/material";
import MenuIcon from "@material-ui/icons/Menu";
import { useJsonToCsv } from "react-json-csv";

import BroadCastMessage from "../../components/Group/BroadCastMsg";
import { useDrawer } from "components/Drawer";
import { border, display, width } from "@mui/system";

const { saveAsCsv } = useJsonToCsv();

const GroupMessage = () => {
    const drawerCtx = useDrawer();

    // const [groupMessage, setGroupMessage] = useState([]);
    const [openModalCreate, setOpenModalCreate] = useState(false);
    const [selected, setSelected] = useState([]);
    const [broadcastLists, setBroadCastLists] = useState([]);
    const [editBroadCastContactsData, seteditBroadCastContactsData] = useState();
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editMessageData, setEditMessageData] = useState(false);
    const [waiting, setWaiting] = useState(false);
    const [todayMessage, setTodayMessage] = useState([]);
    const [totalMessage, setTotalMessage] = useState([]);
    const [active,setActive] = useState();

    // useEffect(async () => {
    //     const sendToDb = await api.get(`${getSession()}/get-broadcast`, {}, config());
    //     setBroadCastLists(sendToDb.data.data);
    // }, [])

    
    const fetchedList = async () => {
        setWaiting(true);
        try {
            const response = await api.get(
                `${getSession()}/get-broadcast`,
                {},
                config()
            );
            const broadcastLists = response.data.data || [];
            setBroadCastLists(broadcastLists);

        } catch (error) {
            console.error("error in fetching data", error);
        } finally {
            setWaiting(false);
        }
    };
    

    const handleOpenGroupMessage = () => {
        setOpenModalCreate(true);
    };
    const handleCloseGroupMessage = () => {
        setOpenModalCreate(false);
    };



    const handleEditClick = (contactsData) => {
        console.log("Edit Clicked", contactsData);
        seteditBroadCastContactsData(contactsData);
        setEditModalOpen(true);
    };
    const handleSendClick = (messageData) => {
        console.log("Send Message Clicked");
        setEditMessageData(messageData);
        setEditModalOpen(true);
    };



    const handleTodayMessage = async () => {
        console.log("today's button has been clicked");
        const todayMsg = await api.get(
            `${getSession()}/get-broadcast`,
            {},
            config()
        );
        const broadcastLists = todayMsg.data.data || [];
        // console.log(broadcastLists);

        const todayMessage = broadcastLists.filter((items) => {
            const format = new Date().toLocaleDateString();
            // console.log("today's ", format);
            const date = new Date(items.createdAt).toLocaleDateString();
            // console.log("total", date);
            // if (date === format) {
            //     setTodayMessage(prev=>prev +1);
            // } else {
            //     console.log("today's date has not matched");
            // }
            return date === format;
        });

        setTodayMessage(todayMessage.length);
        setBroadCastLists(todayMessage);
        // console.log(todayMessage.length);
        // console.log("today's message", todayMessage);
    };



    const handleTotalMessage = async () => {
        console.log("total button has been clicked");
        try {
            const response = await api.get(
                `${getSession()}/get-broadcast`,
                {},
                config()
            );
            const totalMessage = response.data.data || " ";
            // console.log(totalMessage);
            setTotalMessage(totalMessage.length);
        } catch (error) {
            console.log("Can not get total broadcast messages", error);
        }
    };


    const columns = [
        {
            field: "groupName",
            headerName: "groupName",
            width: 200,
        },
        {
            field: "contacts",
            headerName: "Contacts",
            width: 300,
            renderCell: (params) => (
                <div
                    style={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        lineHeight: "1.4em",
                        marginLeft: "15px",
                    }}
                >
                    {params.value.map((contacts, index) => (
                        <div key={index}>
                            {index + 1}.{contacts}
                        </div>
                    ))}
                </div>
            ),
        },
        {
            field: "message",
            headerName: "Message",
            width: 300,
            renderCell: (params) => <div title={params.value}>{params.value}</div>,
        },
        {
            field: "createdAt",
            headerName: "Created At",
            width: 200,
        },
        {
            field: "edit",
            headerName: "Edit",
            width: 200,
            renderCell: (params) => (
                <button
                    onClick={() => handleEditClick(params.row)}
                    style={{
                        border: "none",
                        borderRadius: "8px",
                        backgroundColor: "blueviolet",
                        color: "white",
                        padding: "4px 8px",
                        width: "30%",
                        cursor: "pointer",
                        marginLeft: "30%",
                    }}
                >
                    Edit
                </button>
            ),
        },
        {
            field: "sendmessage",
            headerName: "Send Message",
            width: 300,
            renderCell: (params) => (
                <button
                    onClick={() => handleSendClick(params.row)}
                    style={{
                        border: "none",
                        borderRadius: "6px",
                        backgroundColor: "lawngreen",
                        color: "white",
                        padding: "5px 5px",
                        width: "40%",
                        cursor: "pointer",
                    }}
                >
                    Send Message
                </button>
            ),
        },
    ];

    //root cause :This means your DataGrid is identifying each row using the id field.
    // updates the item in broadcastLists, but _id stays as _id — so when you recreate rows,
    // the id field still works, but React thinks it's a new object.
    const rows = broadcastLists.map((item) => ({
        ...item,
        id: item._id,
        groupName: item.groupName || "UnNamed",
        contacts: item.contacts || [],
        message: item.message || " ",
        createdAt: new Date(item.createdAt).toLocaleString(),
    }));

    // onSubmitFuction = (index) => {
    //     broadcastLists[index].contacts.map( async (item)=>{
    //           const messageBody = {
    //                 phone: item,
    //                 message: 'sadf',
    //            };
    //          await api.post(`${getSession()}/send-message`, messageBody, config());
    //     })
    // }

    return (
        <Layout>
            <BroadCastMessage
                handleClose={() => {
                    handleCloseGroupMessage();
                    setEditModalOpen(false);
                }}
                open={openModalCreate || editModalOpen}
                onBroadcastSaved={(newBroadCast) => {
                    console.log("new data has been arrived ", newBroadCast);
                    setBroadCastLists((prev) => [newBroadCast, ...prev]);
                }}
                editBroadCastContactsData={
                    editModalOpen ? editBroadCastContactsData : null
                }
                editMessageData={editModalOpen ? editMessageData : null}
                onBroadcastUpdated={(updateBroadCast) => {
                    console.log("data has been updated : ", updateBroadCast);
                    setBroadCastLists((prev) =>
                        prev.map((item) =>
                            item._id === updateBroadCast._id
                                ? { ...updateBroadCast, id: updateBroadCast._id }
                                : item
                        )
                    );
                }}
            />
            <IconButton />
            <Container>
                <LeftContainer>
                    <ul>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                marginBottom: "20px",
                            }}
                        >
                            <IconButton
                                color="inherit"
                                aria-label="open drawer"
                                onClick={() => {
                                    drawerCtx.open();
                                }}
                                edge="start"
                            >
                                <MenuIcon />
                            </IconButton>
                        </div>

                        <li
                            onClick={() => {
                                setSelected(1);
                                // fetchedList();
                                console.log("group clicked");
                            }}
                        >
                            <div className={"wrapper-li"}>
                                <div className={"wrapper-ic"}>
                                    <ListOrdered />
                                </div>
                                <div className={"wrapper-text"}>
                                    <h2>All BroadCast Groups</h2>
                                    <p>Manage all your chat message Group</p>
                                </div>
                            </div>
                        </li>
                        <li
                            onClick={() => {
                                setSelected(2);
                                handleOpenGroupMessage();
                            }}
                        >
                            <div className={"wrapper-li"}>
                                <div className={"wrapper-ic"}>
                                    <FilePlus />
                                </div>
                                <div className={"wrapper-text"}>
                                    <h2>Send a broadcast Message</h2>
                                    <p>Create a group for a braodcast message</p>
                                </div>
                            </div>
                        </li>

                        <li
                            onClick={() => {
                                saveAsCsv({
                                    data: rows,
                                    fields: { id: "ID", name: "Name" },
                                    filename: `group-message-${getSession()}`,
                                });
                                setSelected(3);
                            }}
                        >
                            <div className={"wrapper-li"}>
                                <div className={"wrapper-ic"}>
                                    <Sheet />
                                </div>
                                <div className={"wrapper-text"}>
                                    <h2>Export</h2>
                                    <p>Manage all your chat message Group</p>
                                </div>
                            </div>
                        </li>
                    </ul>
                </LeftContainer>
                <RightContainer>
                    <HeaderComponent>
                        <h2>Group Message Panel</h2>
                        <div>
                            <input type="text" placeholder="Search Group " />
                        </div>
                    </HeaderComponent>
                    <CentralContainer>
                        <div className="abba">
                            <div
                                style={{ backgroundColor : active===1 ? "lightgreen ": "lightgray"}}
                                onClick={() => {
                                    setSelected(4) 
                                    handleTodayMessage();
                                    setActive(1);
                                }}
                                className="card">
                                <b>Today's BroadCast Messages</b>
                                
                                 <h1>{todayMessage}</h1>
                            </div>

                            <div
                                style={{ backgroundColor : active===2 ? "lightgreen ": "lightgray"}}
                                onClick={() => {
                                    handleTotalMessage();
                                    fetchedList();
                                    setActive(2);
                                }}
                                className="card"
                            >
                                <b>Total BroadCast Messages</b>
                                {/* <h1>{Array.isArray(totalMessage) ? totalMessage.length : totalMessage}</h1> */}
                                <h1>{totalMessage}</h1>
                            </div>

                            <div 
                                style={{ backgroundColor : active===3 ? "lightgreen ": "lightgray"}}
                                className="card"
                                onClick={()=>{
                                    setActive(3)
                                }}
                            >
                                <b>7 days BroadCast Messages </b>
                                <h1>count</h1>
                            </div>

                            <div
                                style={{ backgroundColor : active===4 ? "lightgreen ": "lightgray"}}
                                onClick={()=>{
                                    setActive(4)
                                }} 
                                className="card"
                            >
                                <b>The Last Button</b>
                                <h1>count</h1>
                            </div>
                        </div>
                    </CentralContainer>


                    {/* {selected === 1 &&
                        (waiting ? (
                            <p></p>
                        ) : setBroadCastLists ? (
                            <TableContainer>
                                <DataGrid
                                    getRowHeight={(params) => {
                                        const base = 50;
                                        const increaseContact =
                                            params.model.contacts?.length || " ";
                                        // console.log(params.model.contacts?.length);
                                        const messageHeight =
                                            Math.ceil((params.model.message?.length || 0) / 50) * 20;
                                        // console.log(messageHeight);
                                        // console.log(increaseContact);
                                        return base + increaseContact + messageHeight;
                                    }}
                                    columns={columns}
                                    rows={rows}
                                    color="primary"
                                    variant="outlined"
                                    shape="rounded"
                                    pageSize={15}
                                />
                            </TableContainer>
                        ) : (
                            <p>Click All BroadCast Group to preview</p>
                        ))} */}
                    {selected === 4 && setBroadCastLists ? (
                        <TableContainer>
                            <DataGrid
                                getRowHeight={(params) => {
                                    const base = 50;
                                    const increaseContact = params.model.contacts?.length || " ";
                                    const messageHeight = Math.ceil((params.model.message?.length || 0) / 50) * 20;
                                    return base + increaseContact + messageHeight;
                                }}
                                columns={columns}
                                rows={rows}
                                color="primary"
                                variant="outlined"
                                shape="rounded"
                                pageSize={15}
                            />
                        </TableContainer>
                    ) : (
                        <p style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>Click Above to preview</p>
                    )}
                </RightContainer>
            </Container>
        </Layout>
    );
};
export default GroupMessage;
