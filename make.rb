#!/usr/bin/env ruby

files = %w[intro main sprite quadtree world outro].map { |fn| "#{fn}.js" }
bodies = "bodies.js"
File.open(bodies, "w") do |f|
  files.each { |fn| f.write(File.read(fn)) }
end
