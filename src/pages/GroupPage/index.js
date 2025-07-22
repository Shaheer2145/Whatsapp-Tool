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
import { Container, Layout, LeftContainer, RightContainer } from "./style";
import { HeaderComponent, TableContainer } from "../Contacts/style";
import api from "../../services/api";
import { getSession } from "../../services/auth";
import config from "../../util/sessionHeader";
import { DataGrid } from "@material-ui/data-grid";
import { FilePlus, ListOrdered, Sheet, UserPlus } from "lucide-react";
import ModalCreateGroup from "../../components/Group/CreateGroup";
import { useJsonToCsv } from 'react-json-csv';
import { IconButton } from "@mui/material";
import MenuIcon from "@material-ui/icons/Menu";
import { useDrawer } from "components/Drawer";
import { width } from "@mui/system";

const { saveAsCsv } = useJsonToCsv();

const GroupPage = () => {
    const drawerCtx = useDrawer();
    const [groups, setGroups] = useState([]);
    const [selected, setSelected] = useState(1);
    const [openModalCreate, setOpenModalCreate] = useState(false);

    const handleOpenCreate = () => {
        setOpenModalCreate(true);
    };

    const handleCloseCreate = () => {
        setOpenModalCreate(false);
    };

    const columns = [
        {
            field: "Profile Image",
            renderCell: (params) => (
                <img src={`https://ui-avatars.com/api/?name=${params.value === undefined ? "ND" : params.value}?background=random`}
                    alt={params.value} style={{ width: '30', height: '30', borderRadius: '50%' }} />
            ),
            headerName: "Photo",
            width: '50px',
        },
        {
            field: "id",
            headerName: "ID",
            width: 200
        },
        {
            field: "name",
            headerName: "Name",
            width: 300
        },
    ];

    // const rows = groups.map((group, index) => {
    //     return {
    //         key: index,
    //         id: group.id._serialized,
    //         name: group.name,
    //         phone: group.id._serialized.replace('@g.us', ''),
    //     };
    // });
    const rows = Array.isArray(groups) ? groups.map((group, index) => ({
        id: group.id?._serialized || group.id,
        name: group.name || "unnamed",
        phone: (group.id?._serialized || group.id || " ").replace('@g.us', '')
    })) : [];
    async function getAllGroups() {
        try {
            const { data: allGroups } = await api.get(`/api/${getSession()}/all-groups`, config());
            console.log("Session:", getSession());
            const arr = [];

            for (const group of allGroups.response) {
                if (group.id.user !== undefined) {
                    arr.push(group);
                }

            }
            setGroups(arr);
        }
        catch (error) {
            console.error('Error fetching groups:', error);
        }

    }

    const addGroup = (newGroup)=>{
        setGroups((prev)=>[...prev,newGroup]);
    }

    useEffect(() => {
        getAllGroups();
    }, []);

    return (
        <Layout>
            <ModalCreateGroup
                handleClose={handleCloseCreate}
                open={openModalCreate} 
                getAllGroups={getAllGroups}
                addGroup={addGroup}
            />
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
                            getAllGroups();
                        }
                        }>
                            <div className={"wrapper-li"}>
                                <div className={"wrapper-ic"}>
                                    <ListOrdered />
                                </div>
                                <div className={"wrapper-text"}>
                                    <h2>
                                        All Groups
                                    </h2>
                                    <p>
                                        Manage all your groups.
                                    </p>
                                </div>
                            </div>
                        </li>

                        <li onClick={() => {
                            setSelected(2);
                            handleOpenCreate();
                        }}>
                            <div className={"wrapper-li"}>
                                <div className={"wrapper-ic"}>
                                    <FilePlus />
                                </div>
                                <div className={"wrapper-text"}>
                                    <h2>
                                        Create Group
                                    </h2>
                                    <p>
                                        Create a WhatsApp group in an automated way.
                                    </p>
                                </div>
                            </div>
                        </li>
                        <li onClick={() => {
                            saveAsCsv({
                                data: rows,
                                fields: { "id": "ID", "name": "Name" },
                                filename: `group-${getSession()}`
                            });
                            setSelected(3);
                        }}>
                            <div className={"wrapper-li"}>
                                <div className={"wrapper-ic"}>
                                    <Sheet />
                                </div>
                                <div className={"wrapper-text"}>
                                    <h2>
                                        Export Group List
                                    </h2>
                                    <p>
                                        Export your group list to excel.
                                    </p>
                                </div>
                            </div>
                        </li>
                    </ul>
                </LeftContainer>

                <RightContainer>
                    <HeaderComponent>
                        <h2>
                            Groups
                        </h2>

                        <div>
                            <input placeholder={"Search for Groups ... "} />
                        </div>
                    </HeaderComponent>
                    {selected === 1 &&
                        Array.isArray(groups) && groups.length > 0 ?
                        (<TableContainer>
                            <DataGrid
                                color="primary"
                                variant="outlined"
                                shape="rounded"
                                pageSize={15}
                                columns={columns}
                                rows={rows}
                            />
                        </TableContainer>) : (
                            <p>Click "All Groups" above to see the groups</p>
                        )
                    }
                </RightContainer>
            </Container>
        </Layout>
    );
};

export default GroupPage;
