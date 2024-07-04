"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { authenticate } from "@/actions/authorization";

const CardLogin = () => {
  const [state, dispatch] = useFormState(authenticate, {
    attempts: 0,
    error: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    const sendErrorToast = (message: string) => {
      const { dismiss } = toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });

      setTimeout(() => {
        dismiss();
      }, 2000);
    };

    switch (state.error) {
      case "Required attributes username & password":
        sendErrorToast("Debes ingresar un username y password");
        break;
      case "Password length should be more than 6 characters":
        sendErrorToast("La contraseña debe tener más de 6 caracteres");
        break;
      case "Invalid Credentials":
        sendErrorToast("Usuario y/o contraseña son incorrectos");
        break;
      case "Something went wrong":
        sendErrorToast("Tuvimos un problema, intentelo más tarde");
        break;
    }
  }, [state, toast]);

  return (
    <Card className="w-[350px]">
      <form action={dispatch}>
        <CardHeader>
          <CardTitle>Ingresa Credenciales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="username">Nombre de usuario</Label>
              <Input id="username" name="username" placeholder="Username" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="******"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            className="bg-secondary hover:bg-secondary-light active:bg-secondary-dark text-white"
            size={"lg"}
          >
            Entrar
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default CardLogin;
