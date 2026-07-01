"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

type FormState = {
  error?: string;
  success?: boolean;
};

type ProductEditFormProps = {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  children: React.ReactNode;
  saved?: boolean;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center rounded-full bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Enregistrement…" : "Enregistrer"}
    </button>
  );
}

export function ProductEditForm({
  action,
  children,
  saved,
}: ProductEditFormProps) {
  const [state, formAction] = useActionState(action, {});

  useEffect(() => {
    if (state.success || saved) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [state.success, saved]);

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100"
    >
      {(state.success || saved) && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Modifications enregistrées avec succès.
        </div>
      )}

      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {children}

      <div className="flex justify-end gap-3 pt-2 text-sm">
        <a
          href="/admin/products"
          className="inline-flex items-center rounded-full border border-zinc-300 px-4 py-2 text-zinc-700 hover:bg-zinc-50"
        >
          Annuler
        </a>
        <SubmitButton />
      </div>
    </form>
  );
}
