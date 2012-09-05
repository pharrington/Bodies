require "sinatra"
require "redis"
require "fileutils"
require "digest"
require "json"
require "yaml"
require "date"

configure do
  CONFIG = YAML.load File.read(File.join(File.dirname(__FILE__), "config.yaml"))
end

before do
  headers["Access-Control-Allow-Origin"] = "*";
  headers["Content-Type"] = "application/json"
end

get "/replay" do
  path = File.join CONFIG[:replay_dir], redis.hget("score:#{params[:key]}", "replay_filepath")
  send_file path, :type => "application/json"
end

get "/scores" do
  scores = nil
  mode, reverse_sort = mode_tuple params["mode"]
  scores_key = "sorted_scores:#{mode}"

  per_page = clamp params[:per_page].to_i, 1, 10
  total_pages = (redis.zcard(scores_key).to_f / per_page).ceil
  total_pages = 1 if total_pages < 1
  page = clamp params[:page].to_i, 1, total_pages
  index = (page - 1) * per_page

  if reverse_sort
    ids = redis.zrevrange scores_key, index, index + per_page - 1
  else
    ids = redis.zrange scores_key, index, index + per_page - 1
  end

  redis.pipelined do
    scores = ids.collect do |id|
      [id, redis.hgetall("score:#{id}")]
    end
  end

  scores.collect! do |s|
    score = s.last.value
    score.delete "replay_filepath"
    score[:key] = s.first
    score
  end

  {
    page: page,
    per_page: per_page,
    pages: total_pages,
    scores: scores
  }.to_json
end

get "/dailybest" do
  score = nil
  mode, reverse_sort = mode_tuple params["mode"]

  if reverse_sort
    id = redis.zrevrange("daily_sorted_scores:#{mode}:#{today_str}", 0, 0)
  else
    id = redis.zrange("daily_sorted_scores:#{mode}:#{today_str}", 0, 0)
  end

  if id.empty?
    return score.to_json
  end

  id = id.first
  score = redis.hgetall "score:#{id}"
  score.delete "replay_filepath"
  score[:key] = id
  score.to_json
end

post "/score" do
  hash = Digest::SHA2.hexdigest params[:replay]
  date = (Time.now.to_f * 1000).to_i
  score = params[:score]
  mode = params[:mode]

  if params[:replay].empty? || !redis.sadd("scores", hash)
    return
  end

  id = redis.incr "score_ids"

  redis.hmset "score:#{id}",
    "score", score,
    "elapsed", params[:elapsed],
    "player", params[:player],
    "mode", mode,
    "replay_filepath", save_replay(params[:replay], hash),
    "date", date

  redis.zadd "daily_sorted_scores:#{mode}:#{today_str}", score, id
  redis.zadd "sorted_scores:#{mode}", score, id
end

def today_str
  Date.today.strftime "%Y%m%d"
end

def save_replay replay, file_name
  directory = File.join random_number, random_number
  FileUtils.mkdir_p File.join(CONFIG[:replay_dir], directory)
  full_path = File.join directory, file_name

  File.open File.join(CONFIG[:replay_dir], full_path), "w:UTF-8" do |f|
    f.write replay
  end

  full_path
end

def random_number
  sprintf "%02d", rand() * 100
end

def redis
  @redis = Redis.new unless @redis
  @redis
end

def clamp value, min, max
  if value < min
    return min
  elsif value > max
    return max
  else
    return value
  end
end

def mode_tuple str
  modes = ["Normal", "TimeAttack"]
  mode = str

  mode = "Normal" unless modes.include? mode
  reverse_sort = true unless mode == "TimeAttack"
  [mode, reverse_sort]
end
