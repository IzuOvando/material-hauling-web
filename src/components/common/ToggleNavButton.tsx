"use client";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "../ui/button";

const ToggleNavButton = () => {
  const pathname = usePathname();
  const router = useRouter();

  const isTrucks = pathname.includes("/trucks");

  const handleGoTo = () => {
    router.push(isTrucks ? "/" : "/trucks");
  };

  return (
    <Button
      type="button"
      onClick={handleGoTo}
      className="bg-primary hover:bg-primary-light active:bg-primary-dark"
    >
      {isTrucks ? "Ir a Tickets" : "Ir a Trucks"}
    </Button>
  );
};

export default ToggleNavButton;
