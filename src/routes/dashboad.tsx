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
import { Route, Switch } from "react-router-dom";
import SendMessagePage from "../pages/ChatPage";
import ContactsPage from "../pages/Contacts";
import Sidebar from "../components/Sidebar";
import GroupPage from "../pages/GroupPage";
import GroupMessagePage from '../pages/GroupMessagePage'
import { DrawerLeft, DrawerProvider } from "../components/Drawer";

export function Dashboard() {
  return (
    <div style={{ display: "flex", width: "100%", overflow: "hidden" }}>
      <Switch>
        <DrawerProvider>
          <DrawerLeft menuContent={<Sidebar />}>
            <Route path="/chat" component={SendMessagePage} />
            <Route path="/contacts" component={ContactsPage} />
            <Route path="/groups" component={GroupPage} />
            <Route path="/groupMessage" component={GroupMessagePage}/>
          </DrawerLeft>
        </DrawerProvider>
      </Switch>
    </div>
  );
}
