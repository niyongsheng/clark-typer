import { Route, Routes } from "react-router";
import { BottomStatusbar } from "./components/BottomStatusbar";
import { Sidebar } from "./components/Sidebar";
import { Titlebar } from "./components/Titlebar";
import { Characters } from "./pages/Characters";
import { Dashboard } from "./pages/Dashboard";
import { Export } from "./pages/Export";
import { FileEditPage } from "./pages/FileEditPage";
import { Files } from "./pages/Files";
import { Outline } from "./pages/Outline";
import { Relations } from "./pages/Relations";
import { Science } from "./pages/Science";
import { Settings } from "./pages/Settings";
import { World } from "./pages/World";
import { Writing } from "./pages/Writing";

export function App() {
  return (
    <>
      <Titlebar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/science" element={<Science />} />
            <Route path="/world" element={<World />} />
            <Route path="/characters" element={<Characters />} />
            <Route path="/relations" element={<Relations />} />
            <Route path="/outline" element={<Outline />} />
            <Route path="/writing" element={<Writing />} />
            <Route path="/files" element={<Files />} />
            <Route path="/file" element={<FileEditPage />} />
            <Route path="/export" element={<Export />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
      <BottomStatusbar />
    </>
  );
}