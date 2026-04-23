import Button from "../ui/Button";

export default function SOSButton({ onClick }) {
  return (
    <Button variant="danger" onClick={onClick}>
      Trigger SOS
    </Button>
  );
}
