import { photoUrl } from '../lib/pocketbase'
import type { Photo } from '../lib/types'

type PhotoGridProps = {
  photos: Photo[]
  onSelect: (photo: Photo) => void
}

export default function PhotoGrid({ photos, onSelect }: PhotoGridProps) {
  return (
    <div className="columns-2 gap-2 lg:columns-3 lg:gap-4">
      {photos.map((photo) => (
        <button
          key={photo.id}
          type="button"
          onClick={() => onSelect(photo)}
          className="group relative mb-2 block w-full break-inside-avoid overflow-hidden bg-mist text-left lg:mb-4"
        >
          <img
            src={photoUrl(photo, '1200x0')}
            alt={photo.title || '摄影作品'}
            className="block w-full object-cover transition duration-500 group-hover:scale-[1.02]"
            style={
              photo.width && photo.height
                ? { aspectRatio: `${photo.width} / ${photo.height}` }
                : undefined
            }
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-2 py-2 opacity-100 transition-opacity duration-300 lg:px-4 lg:py-4 lg:opacity-0 lg:group-hover:opacity-100">
            <p className="truncate text-xs text-white lg:text-sm">
              {photo.title || '未命名'}
            </p>
            {photo.camera_model ? (
              <p className="mt-0.5 truncate text-[10px] text-white/75 lg:text-xs">
                {photo.camera_model}
              </p>
            ) : null}
          </div>
        </button>
      ))}
    </div>
  )
}
