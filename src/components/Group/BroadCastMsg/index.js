import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import api from "../../../services/api";
import config from "../../../util/sessionHeader";
import { getSession } from "../../../services/auth";
import { Autocomplete } from "@material-ui/lab";
import { makeStyles } from "@material-ui/core/styles";
import Modal from "@material-ui/core/Modal";
import Backdrop from "@material-ui/core/Backdrop";
import Snackbar from "@material-ui/core/Snackbar";
import MuiAlert from "@material-ui/lab/Alert";
import {
    CircularProgress,
    TextareaAutosize,
    TextField,
} from "@material-ui/core";
import {
    Button,
    CancelButton,
    Container,
    Footer,
    Header,
    Input,
    ListMenu,
} from "./style";
import Swal from "sweetalert2";

function Alert(props) {
    return <MuiAlert elevation={12} variant="filled" {...props} />;
}

const useStyles = makeStyles((theme) => ({
    modal: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    paper: {
        backgroundColor: "#fff",
        boxShadow: theme.shadows[5],
        width: 500,
        outline: 0,
        border: 0,
        maxHeight: "90%",
        borderRadius: 10,
        padding: "1em 0",
        "@media (max-width:768px)": {
            margin: "0 10px",
        },
    },
}));

const useStylesBackdrop = makeStyles((theme) => ({
    backdrop: {
        zIndex: theme.zIndex.drawer + 1,
        color: "#fff",
    },
}));

function BroadCastMessage({
    open,
    handleClose,
    getContacts,
    onBroadcastSaved,
    editBroadCastContactsData = null,
    onBroadcastUpdated = () => { },
    editMessageData = null,
    onMessageUpdated = () => { },
}) {
    const [openAlert, setOpenAlert] = useState(false);
    const [openBackdrop, setOpenBackdrop] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [broadCastMessage, setBroadcastMessage] = useState("");
    const [tagsChoosed, setTagsChoosed] = useState([]);
    const [groupName, setGroupName] = useState();
    const [file, setFile] = useState("");
    const classesBackdrop = useStylesBackdrop();
    const classes = useStyles();

    useEffect(() => {
        if (open) {
            getContacts([]);
            if (editBroadCastContactsData) {
                setGroupName(editBroadCastContactsData.groupName || " ");
                setTagsChoosed(editBroadCastContactsData.contacts || []);
                setBroadcastMessage(editBroadCastContactsData.message || " ");
                console.log("Selected contacts", tagsChoosed);
                console.log(
                    "Value for Autocomplete",
                    contacts.filter((c) => tagsChoosed.includes(c.id?.user))
                );
            } else if (editMessageData) {
                setGroupName(editMessageData.groupName || " ");
                setTagsChoosed(editMessageData.contacts || []);
                setBroadcastMessage(editMessageData.message || " ");
                console.log("Message is selected ", broadCastMessage);
                console.log("Value for auto complete ");
            }
        }
        return () => {
            setContacts([]);
        };
    }, [open, editBroadCastContactsData]);

    async function getContacts() {
        const { data } = await api.get(`${getSession()}/all-contacts`, config());

        const arr = [];
        for (const contact of data.response) {
            if (contact.isMyContact && contact.id.user !== undefined) {
                arr.push(contact);
            }
        }
        setContacts(arr);
    }

    const handleOpenBackdrop = () => {
        setOpenBackdrop(true);
    };
    const handleCloseBackdrop = () => {
        setOpenBackdrop(false);
    };

    const handleAlertBox = (event, reason) => {
        if (reason === "clickaway") {
            return;
        }
        setOpenAlert(false);
    };

    async function onSubmitForm() {
        if (
            !groupName.trim() ||
            tagsChoosed.length === 0 ||
            !broadCastMessage.trim()
        ) {
            alert("Please fill all the required fields");
            return;
        }
        try {
            handleOpenBackdrop();

            const broadcastPayload = {
                groupName: groupName.trim(),
                contacts: tagsChoosed,
                message: broadCastMessage.trim(),
            };
            // // console.log("payload ",broadcastPayload);
            // console.log("group name", groupName);
            // console.log("contacts", contacts);
            // console.log("Broadcast message", broadCastMessage);
            // // console.log("group name",groupName);

            // const users="923342481524";
            // const message= "Hi";
            // let response;
            // for (let i = 0; i < 100; i++) {
            //     const messageBody = {
            //         phone: users,
            //         message:`${message}.${i}`,
            //     };
            //     response = await api.post(
            //         `${getSession()}/send-message`,
            //         messageBody,
            //         config()
            //     );
            //     console.log(`Message sent to users ${users}:`, response.data);
            // }
            // console.log("All msgs are sent successfullyy");
            // Swal.fire({
            //     icon: "success",
            //     title: "success",
            //     text: "Your message has been broadcasted to selected contacts successfully...",
            // });
            // handleCloseBackdrop();
            // onClose();

            let response;
            //edit contacts only
            if (editBroadCastContactsData && editBroadCastContactsData._id) {
                response = await api.put(
                    `${getSession()}/update-broadcast/${editBroadCastContactsData._id}`,
                    broadcastPayload,
                    config()
                );
                if (typeof onBroadcastUpdated === "function") {
                    onBroadcastUpdated(response.data.data);
                }
                console.log("edited");
                console.log(response.data.data);

                Swal.fire({
                    icon: "success",
                    title: "Success",
                    text: "Your broadcast message has been updated successfully",
                });
                handleCloseBackdrop();
                onClose();
            }

            //edit message only
            else if (editMessageData && editMessageData._id) {
                response = await api.put(
                    `${getSession()}/update-broadcast/${editMessageData._id}`,
                    broadcastPayload,
                    config()
                );
                if (typeof onMessageUpdated === "function") {
                    onMessageUpdated(response.data.data);
                }

                console.log("Message Updated");
                console.log(response.data.data);

                for (const users of tagsChoosed) {

                    const format = users.includes('@') ? users : `${users}@c.us`;
                    console.log("Format:",format);
                    const messageBody = {
                        phone:format,
                        message:broadCastMessage,
                    };
                    console.log("Message body :" ,messageBody);

                    const { data } = await api.post(
                        `${getSession()}/send-message`,
                        messageBody,
                        config()
                    );
                    console.log("Updated message has been sent", users, data);
                }
                Swal.fire({
                    icon: "success",
                    title: "success",
                    text: "Your message has been broadcasted to selected contacts successfully...",
                });
                handleCloseBackdrop();
                onClose();
            }

            //send broadcast only
            else {
                const sendToDb = await api.post(
                    `${getSession()}/send-broadcast`,
                    broadcastPayload,
                    config()
                );
                console.log("Saved to Db:", sendToDb);

                if (typeof onBroadcastSaved === "function") {
                    onBroadcastSaved(sendToDb.data.data);
                }
                console.log("Newly saved broadcast:", sendToDb.data);

                for (const users of tagsChoosed) {
                    // const format = users.includes('@') ? users : `${users}@c.us`;
                    // console.log("Formet ",format);
                    const messageBody = {
                        phone: users,
                        message: broadCastMessage,
                    };
                    console.log("Message Body ", messageBody);
                    console.log("Sending to:", tagsChoosed);
                    
                    setTimeout(async () => {
                        const { data } = await api.post(
                        `${getSession()}/send-message`,
                        messageBody,
                        config()
                    );
                    console.log("Message has been sent", messageBody, data);
                    }, 2000);
                    // const { data } = await api.post(
                    //     `${getSession()}/send-message`,
                    //     messageBody,
                    //     config()
                    // );
                    // console.log("Message has been sent", messageBody, data);
                }

                Swal.fire({
                    icon: "success",
                    title: "success",
                    text: "Your message has been broadcasted to selected contacts successfully...",
                });
                handleCloseBackdrop();
                onClose();
            }
        } catch (error) {
            onClose();
            handleCloseBackdrop();
            console.error("Error in sending message", error.message);
            Swal.fire({
                icon: "error",
                title: "Oops.........",
                text:
                    "There was an error in broadcasting a message .Please try again " ||
                    error.response?.data?.message,
            });
        }
    }

    function onClose() {
        handleClose();
        setGroupName();
        setTagsChoosed([]);
        setBroadcastMessage("");
    }

    const onTagsChange = (event, values) => {
        const arr = [];
        for (const contact of values) {
            if (contact.id) {
                arr.push(contact.id.user);
            } else {
                arr.push(contact);
            }
        }

        setTagsChoosed(arr);
    };
    return (
        <Modal
            aria-labelledby="transition-modal-title"
            aria-describedby="transition-modal-description"
            className={classes.modal}
            open={open}
            onClose={onClose}
        >
            <Container className={classes.paper}>
                <Snackbar
                    open={openAlert}
                    autoHideDuration={3000}
                    onClose={handleAlertBox}
                >
                    <Alert onClick={handleAlertBox} severity="error"></Alert>
                </Snackbar>

                <Backdrop className={classesBackdrop.backdrop} open={openBackdrop}>
                    <CircularProgress color="inherit" />
                </Backdrop>
                <Header>
                    <div>
                        <h1>Send a BroadCast message</h1>
                    </div>
                </Header>
                <ListMenu>
                    <div className={"container"}>
                        <p>Group Name</p>
                        <Input
                            value={groupName}
                            placeholder={"Group Name.."}
                            onChange={(e) => setGroupName(e.target.value)}
                            readOnly={!!editBroadCastContactsData || !!editMessageData}
                        />
                        <p>Choose Participants</p>
                        <Autocomplete
                            freeSolo
                            multiple
                            id="size-small-outlined-multi"
                            size="small"
                            options={contacts}
                            value={contacts.filter((c) => tagsChoosed.includes(c.id?.user))}
                            getOptionLabel={(option) => option.name || option}
                            onChange={(e, values) => {
                                const updatedIds = values
                                    .map((item) =>
                                        typeof item === "string" ? item : item.id?.user
                                    )
                                    .filter(Boolean);
                                console.log("Updated ids", updatedIds);
                                setTagsChoosed(updatedIds);
                            }}
                            style={{ marginBottom: "1em" }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="outlined"
                                    placeholder="Choose a contact"
                                />
                            )}
                            readOnly={!!editMessageData}
                        />
                        <p>Broad-Cast Message</p>
                        <TextareaAutosize
                            value={broadCastMessage}
                            onChange={(e) => setBroadcastMessage(e.target.value)}
                            placeholder={"Write your message....."}
                            rowsMin={4}
                            readOnly={!!editBroadCastContactsData}
                        />
                    </div>
                </ListMenu>
                <Footer>
                    <CancelButton onClick={onClose}>Cancel</CancelButton>
                    <Button onClick={onSubmitForm}>Send Message</Button>
                </Footer>
            </Container>
        </Modal>
    );
}
BroadCastMessage.propTypes = {
    open: PropTypes.bool.isRequired,
    handleClose: PropTypes.func.isRequired,
    getContacts: PropTypes.func.isRequired,
    onBroadcastSaved: PropTypes.func,
    editBroadCastContactsData: PropTypes.object,
    onBroadcastUpdated: PropTypes.func,
    editMessageData: PropTypes.object,
    onMessageUpdated: PropTypes.func,
};

export default BroadCastMessage;
