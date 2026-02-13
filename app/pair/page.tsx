"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { ConnectWallet } from "@coinbase/onchainkit/wallet"
import { useStories } from "@/lib/stories-context" // asumsi ini punya daftar stories user + explore
import { Link as LucideLink, Sparkles, Plus } from "lucide-react"

export default function PairPage() {
  const { isConnected } = useAccount()
  const { stories } = useStories() // stories dari context (explore + user punya)

  const [selectedOwn, setSelectedOwn] = useState<string | null>(null)
  const [selectedOther, setSelectedOther] = useState<string | null>(null)

  // Filter username milik user sendiri (dari stories yang addressnya match)
  // Untuk MVP, kita ambil semua dulu – nanti refine
  const ownUsernames = stories
    .filter(s => s.address === useAccount().address) // optional filter
    .map(s => s.username)

  const exploreUsernames = stories.map(s => s.username)

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Pair Your Names</h1>
        <p className="mt-3 text-base text-muted-foreground">
          Connect wallet dulu biar bisa pair username dan publish filosofi baru yang lebih karismatik.
        </p>
        <div className="mt-8">
          <ConnectWallet className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground hover:bg-primary/90" />
        </div>
      </div>
    )
  }

  const handlePair = () => {
    if (!selectedOwn || !selectedOther) return
    const pairedName = `${selectedOwn} × ${selectedOther}`
    // Logic selanjutnya: redirect ke /write dengan prefill username = pairedName
    // atau buat flow publish langsung di sini
    alert(`Pair berhasil! Username baru: ${pairedName}\n\nFilosofi-nya mau ditulis sekarang?`)
    // nanti ganti jadi router.push(`/write?prepair=${encodeURIComponent(pairedName)}`)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground">Pair Names</h1>
      <p className="mt-2 text-base text-muted-foreground">
        Gabungkan dua username jadi satu yang baru, lebih powerful, dan punya cerita unik. 
        Publish filosofinya → komunitas bisa kasih USDC lebih besar!
      </p>

      <div className="mt-8 space-y-8">
        {/* Pilih username milikmu */}
        <div>
          <label className="block text-base font-semibold text-foreground mb-3">
            Username Milikmu (yang sudah dipublish)
          </label>
          {ownUsernames.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Belum ada username yang dipublish. Mulai dari menu Write dulu yuk!
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ownUsernames.map(name => (
                <button
                  key={name}
                  onClick={() => setSelectedOwn(name)}
                  className={`rounded-xl border-2 px-4 py-3 text-center text-sm font-medium transition-all ${
                    selectedOwn === name
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 bg-card"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pilih username dari explore */}
        <div>
          <label className="block text-base font-semibold text-foreground mb-3">
            Pair dengan username ini (dari Explore)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-2">
            {exploreUsernames
              .filter(n => n !== selectedOwn) // hindari pair sama diri sendiri
              .map(name => (
                <button
                  key={name}
                  onClick={() => setSelectedOther(name)}
                  className={`rounded-xl border-2 px-4 py-3 text-center text-sm font-medium transition-all ${
                    selectedOther === name
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 bg-card"
                  }`}
                >
                  {name}
                </button>
              ))}
          </div>
        </div>

        {/* Hasil Pair & tombol */}
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
          {selectedOwn && selectedOther ? (
            <>
              <div className="flex items-center justify-center gap-4 text-2xl font-bold text-primary mb-4">
                {selectedOwn} <Plus className="h-6 w-6" /> {selectedOther}
              </div>
              <p className="text-base text-foreground mb-6">
                Username baru potensial: <span className="font-semibold">{selectedOwn} × {selectedOther}</span>
              </p>
              <button
                onClick={handlePair}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <LucideLink className="h-5 w-5" />
                Pair & Buat Filosofi
              </button>
            </>
          ) : (
            <p className="text-base text-muted-foreground">
              Pilih dua username di atas untuk melihat hasil pair-nya 🔥
            </p>
          )}
        </div>
      </div>
    </div>
  )
}