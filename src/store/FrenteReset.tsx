"use client";
import { useEffect } from "react";
import { useFrenteStore } from "@/store";

const FrenteReset = () => {
  const { reset } = useFrenteStore();

  useEffect(() => {
    reset();
  }, [reset]);

  return null;
};

export default FrenteReset;
