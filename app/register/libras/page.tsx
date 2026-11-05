import { RegistrationForm } from "@/components/registration/RegistrationForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Curso de LIBRAS | SEMADEJ Online",
    description: "Inscrição para o curso de LIBRAS para evangelismo e inclusão",
};

export default function LibrasRegisterPage() {
    return (
        <RegistrationForm
            courseType="LIBRAS"
            badge="LIBRAS • Inclusão no Reino"
            title="Curso de LIBRAS"
            subtitle="Língua Brasileira de Sinais para a expansão do Evangelho"
            courseDisplayName="Curso de LIBRAS"
        />
    );
}
