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
import React, { useEffect, useState } from "react";
import { Container, HeaderComponent, Layout, TableContainer } from "./style";
import { DataGrid } from '@mui/x-data-grid';
import api from "../../services/api";
import { getSession } from "../../services/auth";
import config from "../../util/sessionHeader";
import { LeftContainer, RightContainer } from "../GroupPage/style";
import { ListOrdered, Sheet, UserPlus } from "lucide-react";
import {
    JsonToCsv,
    useJsonToCsv
} from 'react-json-csv';
import { IconButton } from "@mui/material";
import MenuIcon from "@material-ui/icons/Menu";
import { useDrawer } from "components/Drawer";
const { saveAsCsv } = useJsonToCsv();


const ContactsPage = () => {
    const drawerCtx = useDrawer();
    const [data, setData] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        getAllContacts();

        return () => {
            setContacts([]);
        };
    }, []);

    async function getAllContacts() {
        setLoading(true);
        try {
            const { data } = await api.get(`${getSession()}/all-contacts`, config())
            const arr = [];

            for (const contact of data.response) {
                if (contact.isMyContact && contact.id.user !== undefined)
                    arr.push(contact);
            }

            setContacts(arr);
            setData(arr);
        }
        finally {
            setLoading(false);
        }

    }

    const rows = contacts.map((contact, index) => {
        return {
            id: index,
            profileImage: contact.name,
            name: contact.name,
            phone: contact.id._serialized.replace('@c.us', '')
        };
    });

    const columns = [
        {
            field: "profileImage",
            // eslint-disable-next-line react/display-name
            renderCell: (params) => (
                <img
                    src={`https://ui-avatars.com/api/?name=${params.value === undefined ? "ND" : params.value}?background=random`}
                    style={{ width: 30, height: 30, borderRadius: "50%" }} alt={params.value} />
            ),
            headerName: "Photo",
            width: "50"
        },
        {
            field: "name",
            headerName: "Name",
            width: "300"
        },
        {
            field: "phone",
            headerName: "Phone",
            width: "200"
        },
    ];
    function searchContact(e) {
        let query = e.target.value;

        let users = data.filter((filtro) => {
            if (filtro.name !== undefined && filtro.id._serialized !== undefined) {
                return filtro.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().indexOf(query.toLowerCase()) > -1 || filtro.id._serialized.indexOf(query) > -1;
            } else {
                return [];
            }
        }
        );

        setContacts(users);

        if (query === "") {
            setContacts(data);
        }
    }

    const columnsExcel = () => {
        return ({
            "name": "Name",
            "phone": "Phone"
        })
    }

    return (
        <Layout>
            <Container>
                <LeftContainer>
                    <ul>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20px' }}>
                            <IconButton
                                color="inherit"
                                aria-label="open drawer"
                                onClick={() => {
                                    drawerCtx.open()
                                }}
                                edge="start"
                            >
                                <MenuIcon />
                            </IconButton>
                        </div>
                        <li onClick={() => {
                            setSelected(1);
                            getAllContacts();
                        }}>
                            <div className={"wrapper-li"}>
                                <div className={"wrapper-ic"}>
                                    <ListOrdered />
                                </div>
                                <div className={"wrapper-text"}>
                                    <h2>
                                        All Contacts
                                    </h2>
                                    <p>
                                        Manage all your contacts.
                                    </p>
                                </div>
                            </div>
                        </li>

                        <li onClick={() => {
                            setSelected(2);
                        }}>
                            <div className={"wrapper-li"}>
                                <div className={"wrapper-ic"}>
                                    <UserPlus />
                                </div>
                                <div className={"wrapper-text"}>
                                    <h2>
                                        Add Contacts (Soon)
                                    </h2>
                                    <p>
                                        Add contacts remotely.
                                    </p>
                                </div>
                            </div>
                        </li>

                        <li onClick={() => {
                            saveAsCsv({
                                data: rows,
                                fields: { "name": "Name", "phone": "Phone" },
                                filename: `contacts-${getSession()}`
                            });
                            setSelected(3);
                        }}>
                            <div className={"wrapper-li"}>
                                <div className={"wrapper-ic"}>
                                    <Sheet />
                                </div>
                                <div className={"wrapper-text"}>
                                    <h2>
                                        Export Contact List
                                    </h2>
                                    <p>
                                        Export your contact list to excel.
                                    </p>
                                </div>
                            </div>
                        </li>
                    </ul>
                </LeftContainer>

                <RightContainer>
                    <HeaderComponent>
                        <h2>
                            Contacts
                        </h2>

                        <div>
                            <input placeholder={"Search contacts..."} onChange={(e) => searchContact(e)} />
                        </div>
                    </HeaderComponent>
                    {selected === 1
                        && (
                            loading ? (
                                <p style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>Loading BroadCast Group</p>
                            ) : setContacts ? (
                                <TableContainer>
                                    <DataGrid
                                        color="primary"
                                        variant="outlined"
                                        shape="rounded"
                                        pageSize={15}
                                        columns={columns}
                                        rows={rows}
                                        minHeight="100%"
                                    />
                                </TableContainer>
                            ) : (
                                <p>Click "All Contacts" to preview all contacts </p>
                        )
                    )}

                </RightContainer>
            </Container>
        </Layout>
    );
};

export default ContactsPage;
