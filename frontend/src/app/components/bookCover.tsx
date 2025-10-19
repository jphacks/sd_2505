import Image from "next/image";
import { Book } from "@/types/book";

export const bookCover = ({imageUrl}:Book) => {
    const imagepath = `${imageUrl}`
    
    return (
        <Image className="h-16 w-16 text-primary/40"
      src={imagepath}
      alt={`${imageUrl}`}
      width={100}
      height={100}/>
    )
  }