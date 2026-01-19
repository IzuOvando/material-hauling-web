export default function LoadingTickets() {
  return (
    <div className="flex w-full h-full min-h-[40vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-accent animate-spin" />
        </div>
        <p className="text-sm md:text-base font-medium text-primary-dark tracking-wide">
          Cargando información de vouchers
        </p>
      </div>
    </div>
  );
}
