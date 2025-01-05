import DarkModeSwitch from "./DarkModeSwitch";

export default function TopBar() {
  return (
    <div className="fixed top-0 left-0 right-0 p-3 bg-slate-100 dark:bg-slate-900">
      <div className="mx-3 flex items-center justify-between">
        <h1 className="text-lg font-bold">Question GPT Portal</h1>
        <DarkModeSwitch />
      </div>
    </div>
  );
}
