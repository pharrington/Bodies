#!/usr/bin/env ruby

require 'RMagick' # http://en.wikipedia.org/wiki/Stockholm_syndrome 
require 'json'
require 'fileutils'
require 'digest/sha1'

# simple, SHA1 hash of the pixel data
@tiles = {}
@tilemap = []

def tiles; @tiles; end
def tilemap; @tilemap; end

def hash_image(pixels)
  pixels.inject(Digest::SHA1.new) { |hash, p| hash.update(p.to_s) }.digest
end

def create_tile(basename, image)
  index = tiles.size
  {"#{basename}#{index}" => {:image => image}}
end

def get_tile(pixels, base_name, size)
  hash = hash_image(pixels)
  tile = tiles[hash]
  return tile if tile
  #create a new image from this tile, save it to disk and return the name
  image = Magick::Image.new(size, size)
  image.import_pixels(0, 0, size, size, "RGBA", pixels)
  tile = create_tile(base_name, image)
  tiles[hash] = tile
end

def tilize(image, base_name, size)
  0.step(image.rows - 1, size) do |y|
    height = y > image.rows - size ? image.rows - y : size
    0.step(image.columns - 1, size) do |x|
      width = x > image.columns - size ? image.columns - x : size
      pixels = image.export_pixels(x, y, size, size, "RGBA")
      next if pixels.all? { |p| p.zero? }
      tile = get_tile(pixels, base_name, size)
      tilemap << {:tile => tile.keys[0], :x => x, :y => y}
    end
  end
end

def create_tilesheet(basename, size)
  dimensions = Math.sqrt(tiles.size).to_i + 1
  sheet = Magick::Image.new(size * dimensions, size * dimensions) { self.background_color = Magick::Pixel.new(0, 0, 0, 255) }
  tiles.values.each_with_index do |tile, i|
    t = tile.values[0]
    y = (i / dimensions) * size
    x = (i % dimensions) * size
    sheet.composite!(t[:image], x, y, Magick::ReplaceCompositeOp)
    t[:x] = x
    t[:y] = y
    t.delete(:image)
  end
  sheet.write("#{basename}_tilesheet.png")
end

size = 50
basename = "outline"
fn = "#{basename}.png"
image = Magick::Image.read(fn).first
tilize(image, basename, size)
create_tilesheet(basename, size)
File.open("#{basename}_sheet.js", "w") { |f| f.write(Hash[*tiles.values.map(&:to_a).flatten].to_json) }
File.open("#{basename}.js", "w") { |f| f.write(tilemap.to_json) }
