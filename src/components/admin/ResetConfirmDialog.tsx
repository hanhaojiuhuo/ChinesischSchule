"use client";

import { useState } from "react";

const CONFIRM_TEXT = "RESET";

interface ResetConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ResetConfirmDialog({ open, onConfirm, onCancel }: ResetConfirmDialogProps) {
  const [firstInput, setFirstInput] = useState("");
  const [secondInput, setSecondInput] = useState("");

  if (!open) return null;

  const firstMatch = firstInput === CONFIRM_TEXT;
  const bothMatch = firstMatch && secondInput === CONFIRM_TEXT;

  function handleConfirm() {
    if (bothMatch) {
      setFirstInput("");
      setSecondInput("");
      onConfirm();
    }
  }

  function handleCancel() {
    setFirstInput("");
    setSecondInput("");
    onCancel();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">⚠️</span>
          <h2 className="text-lg font-bold text-red-700">
            Warnung / Warning / 警告
          </h2>
        </div>

        <p className="text-sm text-gray-700 mb-2">
          Dies setzt alle Inhalte für die aktuelle Sprache auf die Standardwerte zurück.
          Alle Ihre Änderungen gehen verloren!
        </p>
        <p className="text-sm text-gray-700 mb-2">
          This will reset all content for the current language to default values.
          All your changes will be lost!
        </p>
        <p className="text-sm text-gray-700 mb-4 font-cn">
          此操作将把当前语言的所有内容重置为默认值。您的所有更改都将丢失！
        </p>

        <p className="text-sm font-semibold text-gray-800 mb-3">
          Bitte geben Sie <span className="font-mono bg-red-100 text-red-700 px-1.5 py-0.5 rounded">{CONFIRM_TEXT}</span> zweimal
          ein, um zu bestätigen. / Please type <span className="font-mono bg-red-100 text-red-700 px-1.5 py-0.5 rounded">{CONFIRM_TEXT}</span> twice
          to confirm. / 请输入 <span className="font-mono bg-red-100 text-red-700 px-1.5 py-0.5 rounded">{CONFIRM_TEXT}</span> 两次以确认。
        </p>

        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              1. Eingabe / 1st input / 第一次输入
            </label>
            <input
              type="text"
              value={firstInput}
              onChange={(e) => setFirstInput(e.target.value)}
              placeholder={`${CONFIRM_TEXT}`}
              className={`w-full border rounded px-3 py-2 text-sm font-mono focus:outline-none transition-colors ${
                firstInput === ""
                  ? "border-gray-300 focus:border-amber-500"
                  : firstMatch
                  ? "border-green-500 bg-green-50"
                  : "border-red-400 bg-red-50"
              }`}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              2. Eingabe / 2nd input / 第二次输入
            </label>
            <input
              type="text"
              value={secondInput}
              onChange={(e) => setSecondInput(e.target.value)}
              placeholder={`${CONFIRM_TEXT}`}
              disabled={!firstMatch}
              className={`w-full border rounded px-3 py-2 text-sm font-mono focus:outline-none transition-colors ${
                !firstMatch
                  ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                  : secondInput === ""
                  ? "border-gray-300 focus:border-amber-500"
                  : bothMatch
                  ? "border-green-500 bg-green-50"
                  : "border-red-400 bg-red-50"
              }`}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            Abbrechen / Cancel / 取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!bothMatch}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed rounded transition-colors"
          >
            Zurücksetzen / Reset / 重置
          </button>
        </div>
      </div>
    </div>
  );
}
